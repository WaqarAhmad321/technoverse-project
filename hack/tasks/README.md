# Tasks

One folder per person, one file per task: `hack/tasks/<name>/NNN-short-name.md`. Tasks are done in file-name order, so the number is the priority. Number in tens (010, 020, 030) so a task can be inserted later as 025.

`scripts/task start` takes the next open one. `scripts/task list` shows everyone's.

## The format

    ---
    status: todo
    tier: must
    review: no
    ---
    # Upload a report

    ## Goal
    One or two sentences: what the person can do after this that they could not before.

    ## Done when
    A check someone can run. A click path and what must appear, or a request and the response.
    Example: on /reports, choose sample.pdf, press "Upload report"; the report appears at the
    top of the list with status "Processing" within two seconds.

    ## Owns
    The folders this task works in.

    ## Stand-ins
    Anything from another slice this task needs, and what to use until it exists.

## The three lines at the top

- `status`: `todo` or `done`. `scripts/task done` sets it. Parking is local to a laptop and is not written here.
- `tier`: `must` (the demo story needs it), `should` (it makes the product feel finished) or `extra` (it makes a judge notice).
- `review`: `yes` when the task touches login, writes data another slice reads, handles money, or could lose data on the demo path. `/next` then runs the reviewer agent before landing.

## Rules for a good task

- 20 to 60 minutes. Split anything bigger.
- It depends only on the shared core and the data shapes, never on a teammate's unfinished task.
- Its "Done when" can be run by someone who did not write it.
- Your list is yours: add, split and reorder as the day teaches you. Adding a task for yourself needs nobody's approval.
- `scripts/task start` reads the lists from main, so a new task file counts once it has landed.
- Do not rename or delete the task you are working on. To shrink it, edit its "Done when" and add a new file for the rest.
