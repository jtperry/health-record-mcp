#!/usr/bin/env bash
# Is the Epic sandbox client id active yet?
#
# Epic's sandbox can take a long time to recognise a newly registered client -
# often far longer than the "allow an hour" its app-request documentation
# suggests. Until it does, the authorize endpoint serves a generic "OAuth2 Error"
# page that is indistinguishable from the one a nonexistent client id produces,
# so there is no signal to wait for other than polling.
#
# Exit 0 once the client is recognised, 1 while it is not.

set -uo pipefail

CLIENT_ID="${EPIC_SANDBOX_CLIENT_ID:-8d804225-8ca7-430b-99f1-2b7762258e09}"
REDIRECT="${EPIC_REDIRECT_URI:-https://health.circlejtp.me/ehr-callback}"
AUD="https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4"

url="https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize"
url+="?response_type=code&client_id=${CLIENT_ID}"
url+="&scope=patient%2F*.read"
url+="&redirect_uri=$(printf %s "$REDIRECT" | sed 's|:|%3A|g; s|/|%2F|g')"
url+="&state=probe&aud=$(printf %s "$AUD" | sed 's|:|%3A|g; s|/|%2F|g')"
url+="&code_challenge=rXtB2k3W5GPxKcZz1IGnqL_D_Veg5tPSI5gdS7kbTz0&code_challenge_method=S256"

body=$(curl -sSL --max-time 30 "$url" 2>/dev/null)

if [ -z "$body" ]; then
    echo "$(date '+%H:%M:%S')  no response from Epic (network or timeout)"
    exit 1
fi

if printf '%s' "$body" | grep -q "OAuth2 Error"; then
    echo "$(date '+%H:%M:%S')  not yet - Epic still returns OAuth2 Error (client id not recognised)"
    exit 1
fi

echo "$(date '+%H:%M:%S')  ACTIVE - Epic no longer returns the error page."
echo "                 Page title: $(printf '%s' "$body" | grep -io '<title>[^<]*</title>' | head -1)"
echo "                 Run the flow:"
echo "                 https://health.circlejtp.me/ehr-connect?preview=\$PREVIEW_TOKEN&brandTags=epic^sandbox"
exit 0
