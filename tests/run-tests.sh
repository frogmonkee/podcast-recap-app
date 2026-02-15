#!/bin/bash
# ============================================================
#  Podcast Summary App — Test Suite
#  Usage: ./tests/run-tests.sh [BASE_URL]
#  Default: http://localhost:3000
# ============================================================

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0
SKIP=0
RESULTS=()

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ---- Helpers ----

run_test() {
  local test_id="$1"
  local description="$2"
  local expected_status="$3"
  local method="$4"
  local endpoint="$5"
  local body="$6"

  printf "  [%-5s] %-50s " "$test_id" "$description"

  local start_ms=$(($(gdate +%s%N 2>/dev/null || date +%s000000000) / 1000000))

  if [ "$method" = "GET" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>&1)
  else
    RESPONSE=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$body" 2>&1)
  fi

  local end_ms=$(($(gdate +%s%N 2>/dev/null || date +%s000000000) / 1000000))
  local elapsed=$((end_ms - start_ms))

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "$expected_status" ]; then
    printf "${GREEN}PASS${NC} (%dms)\n" "$elapsed"
    PASS=$((PASS + 1))
    RESULTS+=("PASS|$test_id|$description|$expected_status|$HTTP_CODE|${elapsed}ms")
  else
    printf "${RED}FAIL${NC} (expected %s, got %s) (%dms)\n" "$expected_status" "$HTTP_CODE" "$elapsed"
    echo "         Response: $(echo "$BODY" | head -c 200)"
    FAIL=$((FAIL + 1))
    RESULTS+=("FAIL|$test_id|$description|$expected_status|$HTTP_CODE|${elapsed}ms")
  fi
}

poll_job() {
  local job_id="$1"
  local max_polls="${2:-60}"
  local poll_interval="${3:-5}"
  local poll_count=0
  local last_pct=""

  # Give after() a moment to start processing
  sleep 2

  while [ $poll_count -lt $max_polls ]; do
    local resp=$(curl -s "$BASE_URL/api/jobs/$job_id")
    local status=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','unknown'))" 2>/dev/null)
    local pct=$(echo "$resp" | python3 -c "import sys,json; p=json.load(sys.stdin).get('progress'); print(p.get('percentage',0) if p else 0)" 2>/dev/null)
    local msg=$(echo "$resp" | python3 -c "import sys,json; p=json.load(sys.stdin).get('progress'); print(p.get('message','') if p else '')" 2>/dev/null)

    if [ "$pct" != "$last_pct" ]; then
      printf "         Poll #%d: %s%% — %s\n" "$poll_count" "$pct" "$msg" >&2
      last_pct="$pct"
    fi

    if [ "$status" = "completed" ]; then
      echo "$resp"
      return 0
    elif [ "$status" = "failed" ]; then
      echo "$resp"
      return 1
    fi

    poll_count=$((poll_count + 1))
    sleep "$poll_interval"
  done

  echo '{"status":"timeout"}'
  return 2
}

submit_and_poll() {
  local test_id="$1"
  local description="$2"
  local body="$3"
  local expect_status="${4:-completed}"

  printf "  [%-5s] %-50s\n" "$test_id" "$description"

  local submit_resp=$(curl -s -X POST "$BASE_URL/api/jobs" \
    -H "Content-Type: application/json" \
    -d "$body")

  local job_id=$(echo "$submit_resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('jobId',''))" 2>/dev/null)

  if [ -z "$job_id" ]; then
    printf "         ${RED}FAIL${NC} — could not get jobId: %s\n" "$submit_resp"
    FAIL=$((FAIL + 1))
    RESULTS+=("FAIL|$test_id|$description|jobId|none|0ms")
    return 1
  fi

  printf "         Job ID: %s\n" "$job_id"

  local result
  result=$(poll_job "$job_id" 60 3)
  local result_json=$(echo "$result" | tail -1)
  local final_status=$(echo "$result_json" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','unknown'))" 2>/dev/null)

  if [ "$final_status" = "$expect_status" ]; then
    printf "         ${GREEN}PASS${NC} — status: %s\n" "$final_status"
    PASS=$((PASS + 1))
    RESULTS+=("PASS|$test_id|$description|$expect_status|$final_status|poll")

    # Print result details if completed
    if [ "$final_status" = "completed" ]; then
      local audio_url=$(echo "$result_json" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('audioUrl',''))" 2>/dev/null)
      local summary_len=$(echo "$result_json" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('result',{}).get('summaryText','')))" 2>/dev/null)
      local cost=$(echo "$result_json" | python3 -c "import sys,json; c=json.load(sys.stdin).get('result',{}).get('costBreakdown',{}); print(f\"T:\${c.get('transcription',0):.4f} S:\${c.get('summarization',0):.4f} TTS:\${c.get('tts',0):.4f} Total:\${c.get('total',0):.4f}\")" 2>/dev/null)
      printf "         Audio: %s\n" "$audio_url"
      printf "         Summary length: %s chars\n" "$summary_len"
      printf "         Costs: %s\n" "$cost"

      # Store audio URL for later verification
      echo "$audio_url" >> /tmp/podcast-test-audio-urls.txt
    fi

    if [ "$final_status" = "failed" ]; then
      local error=$(echo "$result_json" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error',''))" 2>/dev/null)
      printf "         Error (expected): %s\n" "$error"
    fi
  else
    printf "         ${RED}FAIL${NC} — expected %s, got %s\n" "$expect_status" "$final_status"
    local error=$(echo "$result_json" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error',''))" 2>/dev/null)
    if [ -n "$error" ]; then
      printf "         Error: %s\n" "$error"
    fi
    FAIL=$((FAIL + 1))
    RESULTS+=("FAIL|$test_id|$description|$expect_status|$final_status|poll")
  fi
  echo ""
}

# ============================================================
echo ""
echo "========================================================"
echo "  Podcast Summary App — Test Suite"
echo "  Base URL: $BASE_URL"
echo "  Date: $(date)"
echo "========================================================"

# Clean up temp files
rm -f /tmp/podcast-test-audio-urls.txt

# ============================================================
echo ""
echo -e "${CYAN}--- SET 2: Edge Cases & Error Handling (FREE) ---${NC}"
echo ""

# Metadata endpoint validation
run_test "2.1" "Empty body to metadata endpoint" "400" "POST" "/api/spotify-metadata" '{}'
run_test "2.2" "Non-Spotify URL (YouTube)" "400" "POST" "/api/spotify-metadata" '{"episodeUrl":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
run_test "2.3" "Spotify track URL (not episode)" "400" "POST" "/api/spotify-metadata" '{"episodeUrl":"https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"}'
run_test "2.4" "Malformed Spotify URL (no ID)" "500" "POST" "/api/spotify-metadata" '{"episodeUrl":"https://open.spotify.com/episode/"}'
run_test "2.5" "Non-existent episode ID" "500" "POST" "/api/spotify-metadata" '{"episodeUrl":"https://open.spotify.com/episode/ZZZZZZZZZZZZZZZZZZZZZZ"}'
run_test "2.13" "Invalid JSON body" "500" "POST" "/api/spotify-metadata" 'not json'

# Jobs endpoint validation
run_test "2.6" "Empty episodes array" "400" "POST" "/api/jobs" '{"episodes":[],"targetDuration":5}'
run_test "2.7" "Missing episodes field" "400" "POST" "/api/jobs" '{"targetDuration":5}'
run_test "2.9" "Poll non-existent job UUID" "404" "GET" "/api/jobs/00000000-0000-0000-0000-000000000000" ""
run_test "2.10" "Poll garbage job ID" "404" "GET" "/api/jobs/not-a-valid-uuid" ""

# Job that fails in pipeline (no audioUrl)
echo ""
submit_and_poll "2.8" "Job with missing audioUrl (should fail)" \
  '{"episodes":[{"url":"https://open.spotify.com/episode/test","title":"No Audio Test","duration":600}],"targetDuration":1}' \
  "failed"

# Concurrent submissions
printf "  [%-5s] %-50s " "2.14" "Concurrent job submissions (3 at once)"
CONCURRENT_IDS=""
for i in 1 2 3; do
  resp=$(curl -s -X POST "$BASE_URL/api/jobs" \
    -H "Content-Type: application/json" \
    -d "{\"episodes\":[{\"url\":\"https://open.spotify.com/episode/test$i\",\"title\":\"Concurrent $i\",\"duration\":60}],\"targetDuration\":1}")
  jid=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('jobId',''))" 2>/dev/null)
  CONCURRENT_IDS="$CONCURRENT_IDS $jid"
done
UNIQUE_COUNT=$(echo "$CONCURRENT_IDS" | tr ' ' '\n' | sort -u | grep -c '.')
if [ "$UNIQUE_COUNT" -eq 3 ]; then
  printf "${GREEN}PASS${NC} (3 unique jobIds)\n"
  PASS=$((PASS + 1))
else
  printf "${RED}FAIL${NC} (got %d unique IDs)\n" "$UNIQUE_COUNT"
  FAIL=$((FAIL + 1))
fi

# HTTP method tests
run_test "2.15" "GET to POST-only metadata endpoint" "405" "GET" "/api/spotify-metadata" ""
run_test "2.16" "POST to GET-only job status endpoint" "405" "POST" "/api/jobs/some-id" '{}'

# ============================================================
echo ""
echo -e "${CYAN}--- SET 1: Happy Path — Metadata (FREE) ---${NC}"
echo ""

# Test 1.1 & 1.2: Metadata fetches
run_test "1.1" "Metadata for valid Spotify episode" "200" "POST" "/api/spotify-metadata" \
  '{"episodeUrl":"https://open.spotify.com/episode/04HuAUtsSeFP97D7OgPNRb"}'

run_test "2.12" "Spotify URL with query params" "200" "POST" "/api/spotify-metadata" \
  '{"episodeUrl":"https://open.spotify.com/episode/04HuAUtsSeFP97D7OgPNRb?si=abc123"}'

# ============================================================
echo ""
echo -e "${CYAN}--- EPISODE DISCOVERY (FREE — finding short eps with audio URLs) ---${NC}"
echo ""

# Try several candidate episodes to find ones with audioUrl
CANDIDATES=(
  "https://open.spotify.com/episode/04HuAUtsSeFP97D7OgPNRb"
  "https://open.spotify.com/episode/1fkHZbaL6tTkUfWEDbIOxQ"
  "https://open.spotify.com/episode/0JF6j6Ou9lNaj1lJg8uP08"
  "https://open.spotify.com/episode/2sY4z3VyhhdFsPLCVSx5Zz"
)

FOUND_EPISODES=()

for url in "${CANDIDATES[@]}"; do
  resp=$(curl -s -X POST "$BASE_URL/api/spotify-metadata" \
    -H "Content-Type: application/json" \
    -d "{\"episodeUrl\":\"$url\"}")

  title=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('title','?'))" 2>/dev/null)
  duration=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('duration',0))" 2>/dev/null)
  audio_url=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('audioUrl',''))" 2>/dev/null)
  show=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('showName','?'))" 2>/dev/null)
  dur_min=$((duration / 60))

  if [ -n "$audio_url" ] && [ "$audio_url" != "None" ] && [ "$audio_url" != "null" ]; then
    printf "  ${GREEN}FOUND${NC}: %-40s | %3dm | %s\n" "$title" "$dur_min" "$show"
    FOUND_EPISODES+=("$url|$title|$duration|$audio_url")
  else
    printf "  ${YELLOW}SKIP${NC}:  %-40s | %3dm | no audioUrl\n" "$title" "$dur_min"
  fi
done

echo ""

if [ ${#FOUND_EPISODES[@]} -eq 0 ]; then
  echo -e "${RED}No episodes with audio URLs found. Cannot run paid pipeline tests.${NC}"
  echo "Try adding more candidate episode URLs to the CANDIDATES array."
else
  echo "Found ${#FOUND_EPISODES[@]} episode(s) with audio URLs."

  # ============================================================
  echo ""
  echo -e "${CYAN}--- SET 1: Happy Path — Pipeline Tests (PAID ~\$0.04 each) ---${NC}"
  echo ""
  echo -e "${YELLOW}These tests will call paid APIs (Fireworks, Claude, OpenAI TTS).${NC}"
  echo -n "Proceed with paid tests? [y/N] "
  read -r confirm
  echo ""

  if [[ "$confirm" =~ ^[Yy]$ ]]; then
    # Use the first found episode
    IFS='|' read -r ep_url ep_title ep_duration ep_audio <<< "${FOUND_EPISODES[0]}"

    # Test 1.3: Single episode, 1-min summary
    submit_and_poll "1.3" "Full pipeline: 1 episode, 1-min summary" \
      "{\"episodes\":[{\"url\":\"$ep_url\",\"title\":\"$ep_title\",\"duration\":$ep_duration,\"audioUrl\":\"$ep_audio\"}],\"targetDuration\":1}" \
      "completed"

    # Test 1.4: Single episode, 5-min summary
    submit_and_poll "1.4" "Full pipeline: 1 episode, 5-min summary" \
      "{\"episodes\":[{\"url\":\"$ep_url\",\"title\":\"$ep_title\",\"duration\":$ep_duration,\"audioUrl\":\"$ep_audio\"}],\"targetDuration\":5}" \
      "completed"

    # Test 1.8: Episode with timestamp truncation (use 25% of episode)
    ts=$((ep_duration / 4))
    submit_and_poll "1.8" "Pipeline with timestamp truncation (${ts}s cutoff)" \
      "{\"episodes\":[{\"url\":\"$ep_url\",\"title\":\"$ep_title\",\"duration\":$ep_duration,\"audioUrl\":\"$ep_audio\",\"timestamp\":$ts}],\"targetDuration\":1}" \
      "completed"

    # Test 1.5: Two episodes (if we have 2)
    if [ ${#FOUND_EPISODES[@]} -ge 2 ]; then
      IFS='|' read -r ep2_url ep2_title ep2_duration ep2_audio <<< "${FOUND_EPISODES[1]}"
      submit_and_poll "1.5" "Full pipeline: 2 episodes, 1-min summary" \
        "{\"episodes\":[{\"url\":\"$ep_url\",\"title\":\"$ep_title\",\"duration\":$ep_duration,\"audioUrl\":\"$ep_audio\"},{\"url\":\"$ep2_url\",\"title\":\"$ep2_title\",\"duration\":$ep2_duration,\"audioUrl\":\"$ep2_audio\"}],\"targetDuration\":1}" \
        "completed"
    else
      echo "  [1.5 ] Skipped — need 2 episodes with audioUrl but only found 1"
      SKIP=$((SKIP + 1))
    fi

    # Test 1.6: Verify audio URLs are accessible
    echo ""
    echo -e "${CYAN}--- Verifying audio blob URLs ---${NC}"
    echo ""
    if [ -f /tmp/podcast-test-audio-urls.txt ]; then
      while IFS= read -r audio_url; do
        if [ -n "$audio_url" ]; then
          printf "  [1.6 ] Checking blob URL... "
          http_info=$(curl -s -o /dev/null -w "%{http_code} %{content_type} %{size_download}" "$audio_url")
          http_code=$(echo "$http_info" | awk '{print $1}')
          content_type=$(echo "$http_info" | awk '{print $2}')
          size=$(echo "$http_info" | awk '{print $3}')

          if [ "$http_code" = "200" ]; then
            printf "${GREEN}PASS${NC} (HTTP %s, %s, %s bytes)\n" "$http_code" "$content_type" "$size"
            PASS=$((PASS + 1))
          else
            printf "${RED}FAIL${NC} (HTTP %s)\n" "$http_code"
            FAIL=$((FAIL + 1))
          fi
        fi
      done < /tmp/podcast-test-audio-urls.txt
    fi
  else
    echo "  Skipping paid pipeline tests."
    SKIP=$((SKIP + 4))
  fi
fi

# ============================================================
echo ""
echo "========================================================"
printf "  Results: ${GREEN}%d passed${NC}, ${RED}%d failed${NC}, ${YELLOW}%d skipped${NC}\n" "$PASS" "$FAIL" "$SKIP"
echo "========================================================"
echo ""

# Write results to file
RESULTS_FILE="tests/test-results-$(date +%Y%m%d-%H%M%S).txt"
{
  echo "Test Results — $(date)"
  echo "Base URL: $BASE_URL"
  echo ""
  printf "%-6s | %-5s | %-50s | %-8s | %-8s | %s\n" "Result" "ID" "Description" "Expected" "Actual" "Time"
  echo "-------|-------|--------------------------------------------------|----------|----------|------"
  for r in "${RESULTS[@]}"; do
    IFS='|' read -r result id desc expected actual time <<< "$r"
    printf "%-6s | %-5s | %-50s | %-8s | %-8s | %s\n" "$result" "$id" "$desc" "$expected" "$actual" "$time"
  done
  echo ""
  echo "Total: $PASS passed, $FAIL failed, $SKIP skipped"
} > "$RESULTS_FILE"
echo "Results written to: $RESULTS_FILE"

# Clean up
rm -f /tmp/podcast-test-audio-urls.txt

# Exit with failure code if any tests failed
[ "$FAIL" -eq 0 ]
