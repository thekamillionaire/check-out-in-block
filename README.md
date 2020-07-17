# Check Out/In Tracker Block
This block is a customizable wizard which, in its most basic form, allows users to select a **Unit** record and create a new linked record in a **Log** table detailing when that record was "checked out" with relevant fields pre-filled to save time. The wizard just as easily allows users to check that unit back in to close out the log and make that unit available for selection once more. Advanced features include tracking a unit's condition over time (i.e. the unit was in "great" condition when it was checked out, but was in "poor" condition when it was checked back in), and the ability to enable a **Items** table for bases structured where each unit is an instance of a type of item (i.e. 5 "Macbook Pros", 6 "Samsung 32-inch TVs", etc.).

This block will make day-to-day data entry for inventory managers, IT departments, librarians, equipment rental businesses, and more all that much easier!

[![video preview](http://img.youtube.com/vi/AZPdeZNQwO4/0.jpg)](http://www.youtube.com/watch?v=AZPdeZNQwO4 "Video preview")

## How to remix this block
1. Create a new base (or you can use an existing base).
2. Create a new block in your base (see [Create a new block](https://airtable.com/developers/blocks/guides/hello-world-tutorial#create-a-new-block), selecting "Remix from Github" as your template.
3. From the root of your new block, run `block run`.

## Notes
For the optional setting for tracking a unit's condition, make sure that all the condition single select fields have overlapping field option values.