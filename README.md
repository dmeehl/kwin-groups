# kwin-groups
A kwin script to "group" windows together.

Adds a menu entry to the windows' context menu to add/remove the window from groups.

Any member of a group that is:
- minimized causes the rest of the members to minimize.
- unminimized causes the rest of the members to unminimize.
- activated causes the rest of the members to activate (come to the front).

Running / Testing:
Since I haven't yet had a chance to package this into an actual kwin script package, the easiest way to test it out is to run `wm console`.
1. Run `wm console`
2. Open the kwin-script-groups.js file.
3. Click execute.
Note: You can safely close wm console now.
