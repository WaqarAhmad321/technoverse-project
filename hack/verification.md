# Verification

`/shape` fills this in.

## The smoke test

The demo story as steps a browser test can check. `scripts/check` runs it before every landing. A step whose slice is still a stub only checks that the screen opens; its owner tightens it when the real thing lands.

| Step | Do | Expect |
|---|---|---|
| 1 | Open the live first screen | The one-line promise and the main action are visible |

## Outside services and their fallbacks

Every service on the demo path. In the check and in demo mode, each answers from a recorded response.

| Service | Used for | If it fails or is slow | Recorded answer lives at |
|---|---|---|---|

## Reset

The one command that puts the demo data back to its starting state:
