# Architecture

`/shape` fills this in. Keep it current: when a data shape gains a field, the change lands here in the same commit.

## Stack

Not chosen yet.

## The shared core

What everyone starts from. Adding to it is free; changing it means fixing every use.

- **The look:** tokens and base components at
- **Login or demo account:**
- **Navigation:**
- **Sample data and the reset command:**
- **Demo-mode switch:**

## The slices

Each slice is a full feature from screen to data, owned by one person.

### Slice 1: (name), owned by waqar

- **Demo-story steps it covers:**
- **Screens and routes:**
- **Data it writes:**
- **Folders it owns:**
- **Reads from other slices:** (what, and the stand-in until it exists)

### Slice 2: (name), owned by umar

- **Demo-story steps it covers:**
- **Screens and routes:**
- **Data it writes:**
- **Folders it owns:**
- **Reads from other slices:**

## Data shapes

One block per table or collection. One writer each.

    name_of_table        written by: (slice)     read by: (slices)
      id                 type
      field              type      what it means
