#!/usr/bin/env bash
# Has our Epic client id reached a given health system yet?
#
# Automatic Client Distribution (USCDI v3) pushes the app to qualifying customers, but
# each organization picks it up on its own schedule - so after going live the app works
# at some orgs and not others, for days or longer. There is no status page for this.
#
# Epic serves a generic "OAuth2 Error" page both for a client it has never heard of and
# for one that has not reached this organization yet, so a failure on its own tells you
# nothing. Every probe here is therefore run twice: once with our client id and once with
# an all-zeros control. Only the pair is meaningful.
#
#   ours = MyChart login, control = OAuth2 Error  -> distributed here
#   ours = OAuth2 Error,  control = OAuth2 Error  -> not yet
#   both = MyChart login                          -> this org does not validate the
#                                                    client id at the authorize step;
#                                                    the probe proves nothing here
#
# Usage:
#   export EPIC_PROD_CLIENT_ID="$(op read 'op://Employee/Epic/Production Client ID')"
#   scripts/check-epic-distribution.sh "Mayo Clinic" MultiCare
#
# Reads the brand directory from the live site unless BRANDS_JSON points at a local copy.

set -uo pipefail

CLIENT_ID="${EPIC_PROD_CLIENT_ID:-}"
if [ -z "$CLIENT_ID" ]; then
    echo "EPIC_PROD_CLIENT_ID is not set." >&2
    echo "  export EPIC_PROD_CLIENT_ID=\"\$(op read 'op://Employee/Epic/Production Client ID')\"" >&2
    exit 2
fi
if [ "$#" -eq 0 ]; then
    echo "Usage: $0 <organization name> [organization name ...]" >&2
    exit 2
fi

REDIRECT="${EPIC_REDIRECT_URI:-https://health.circlejtp.me/ehr-callback}"
BRANDS_URL="${BRANDS_URL:-https://health.circlejtp.me/brands/epic.json}"
CONTROL_ID="00000000-0000-0000-0000-000000000000"
# Any well-formed S256 challenge; the flow never gets far enough to verify it.
CHALLENGE="KsJ3XpwcLRJzAq84QycAVOuhyL9sr2IgFr7Lnq5ulKs"

brands_file="${BRANDS_JSON:-}"
if [ -z "$brands_file" ]; then
    brands_file="$(mktemp)"
    trap 'rm -f "$brands_file"' EXIT
    echo "Fetching the brand directory (~47 MB; set BRANDS_JSON to reuse a local copy)..." >&2
    curl -sS --max-time 300 -o "$brands_file" "$BRANDS_URL" || { echo "Could not fetch $BRANDS_URL" >&2; exit 1; }
fi

urlencode() { python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$1"; }

# Title of the page Epic serves for this client id at this authorize endpoint.
probe_title() {
    curl -sSL --max-time 30 \
        "${1}?response_type=code&client_id=${2}&scope=patient%2F*.read&redirect_uri=$(urlencode "$REDIRECT")&state=probe&aud=$(urlencode "$3")&code_challenge=${CHALLENGE}&code_challenge_method=S256" \
        | grep -io '<title>[^<]*</title>' | head -1 | sed 's/<[^>]*>//g'
}

distributed=0
pending=0

for name in "$@"; do
    endpoint="$(BRAND_NAME="$name" python3 - "$brands_file" <<'PY'
import json, os, sys
want = os.environ["BRAND_NAME"].lower()
items = json.load(open(sys.argv[1]))["items"]
hits = [i for i in items
        if i.get("itemType") == "brand" and want in (i.get("displayName") or "").lower()]
if hits:
    hits.sort(key=lambda i: len(i["displayName"]))
    print(hits[0]["endpoints"][0]["url"])
PY
)"
    if [ -z "$endpoint" ]; then
        printf '%-34s no brand matching that name\n' "$name"
        continue
    fi

    authorize="$(curl -sS --max-time 30 "${endpoint%/}/.well-known/smart-configuration" \
        | python3 -c 'import sys,json;print(json.load(sys.stdin).get("authorization_endpoint",""))' 2>/dev/null)"
    if [ -z "$authorize" ]; then
        printf '%-34s SMART discovery failed (endpoint may be down)\n' "$name"
        continue
    fi

    ours="$(probe_title "$authorize" "$CLIENT_ID" "$endpoint")"
    control="$(probe_title "$authorize" "$CONTROL_ID" "$endpoint")"

    if [ "$ours" = "$control" ]; then
        case "$ours" in
            *OAuth2\ Error*) printf '%-34s not yet distributed\n' "$name"; pending=$((pending+1)) ;;
            *)               printf '%-34s inconclusive - this org accepts the control too (%s)\n' "$name" "$ours" ;;
        esac
    else
        printf '%-34s DISTRIBUTED (%s)\n' "$name" "$ours"
        distributed=$((distributed+1))
    fi
done

echo
echo "distributed: $distributed   pending: $pending"
# Exit 0 only when every organization asked about is live, so this can gate a script.
[ "$pending" -eq 0 ] && [ "$distributed" -gt 0 ]
