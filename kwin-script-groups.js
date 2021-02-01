/********************************************************************
 KWin - Groups

 Copyright (C) 2021 Daniel Meehl <mr.cratos@gmail.com>

 This program is free software; you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
*********************************************************************/

var windowGroups = [];
var activeClientChanging = {groupNum: -1, clients: []};

var whichGroup = function(window) {
  for (var i = 0; i < windowGroups.length; i++) {
    var group = windowGroups[i];
    for (var j = 0; j < group.length; j++) {
      var idInGroup = group[j];
      if (idInGroup == window.windowId) {
        return i;
      }
    }
  }
  return -1;
};

var addToGroup = function(groupNum, window) {
  windowGroups[groupNum].push(window.windowId);
  attachHandlers(window);

  //TODO: Why doesn't this work?
  //window.skipTaskbar = true;
};

var removeFromGroup = function(groupNum, window) {
  var group = windowGroups[groupNum];
  for (var i = 0; i < group.length; i++) {
    if (group[i] == window.windowId) {
      windowGroups[groupNum].splice(i, 1);
      if (windowGroups[groupNum].length == 0) {
        windowGroups.splice(groupNum, 1);
      }
      break;
    }
  }
};

registerUserActionsMenu(function(window) {
  var menuActions = {
    text: "Groups",
    items: []
  };

  var groupNum = whichGroup(window);
  if (groupNum == -1) {
    for (var i = 0; i < windowGroups.length; i++) {
      var groupNum = i;
      var targetWindow = window;
      menuActions.items.push({
        text: ("Add to Group " + (i + 1)),
        triggered: function() {
          addToGroup(groupNum, targetWindow)
        }
      });
    }
    menuActions.items.push({
      text: ("Add to Group " + (windowGroups.length + 1)),
      triggered: function() {
        var newGroup = [];
        newGroup.push(window.windowId);
        windowGroups.push(newGroup);
        attachHandlers(window);
      }
    });
  } else {
    menuActions.items.push({
      text: ("Remove from Group " + (groupNum + 1)),
      triggered: function() {
        //window.skipTaskbar = false;
        removeFromGroup(groupNum, window);
      }
    });
  }

  return menuActions;
});

var attachHandlers = function(client) {
  client.clientMinimized.connect(function(client) {
    try {
      var groupNum = whichGroup(client);
      if (groupNum > -1) {
        var clients = workspace.clientList();
        for (var i = 0; i < clients.length; i++) {
          var clientIn = whichGroup(clients[i]);
          if (clientIn == groupNum) {
            clients[i].minimized = true;
          }
        }
      }
    } catch (err) {
      print(err, "in Mimimized");
    }
  });

  client.clientUnminimized.connect(function(client) {
    try {
      var groupNum = whichGroup(client);
      var clients = workspace.clientList();
      for (var i = 0; i < clients.length; i++) {
        var clientIn = whichGroup(clients[i]);
        if (clientIn == groupNum && client.windowId != clients[i].windowId) {
          clients[i].minimized = false;
        }
      }
    } catch (err) {
      print(err, "in Unminimized");
    }
  });

  // When one group member is activated, we'll activate the rest of the group members.
  // After this callback returns, we'll get events for all of the members of the
  // group... We need to ignore them.
  client.activeChanged.connect(function() {
    try {
      var client = workspace.activeClient;
      if (client == null) {
        return;
      }

      var groupNum = whichGroup(client);
      if (groupNum > -1) {
        // If we're still waiting on callbacks for clients that we previously activated,
        // we'll pull them off the list one-by-one until we've seen all of them.
        // Obviously, the assumption here is that we're going to recieve all of the callbacks
        // from the clients we previously activated before we see a callback from any other client.
        if (activeClientChanging.clients.length > 0) {
          for (var i = 0; i < activeClientChanging.clients.length; i++) {
            if (activeClientChanging.clients[i] == client.windowId) {
              activeClientChanging.clients.splice(i, 1);
              break;
            }
          }
          return;
        }

        // Keep track of callbacks we'll be waiting for.
        for (var i = 0; i < windowGroups[groupNum].length; i++) {
          activeClientChanging.clients.push(windowGroups[groupNum][i]);
        }

        // Activate other members of this group, and then activate the target client last.
        var clients = workspace.clientList();
        for (var i = 0; i < clients.length; i++) {
          var clientIn = whichGroup(clients[i]);
          if (clientIn == groupNum && client.windowId != clients[i].windowId) {
            workspace.activeClient = clients[i];
          }
        }
        workspace.activeClient = client;
      }
    } catch (err) {
      print(err, "in ActiveChanged");
    }
  });
};

workspace.clientRemoved.connect(function(client) {
  var groupNum = whichGroup(client);
  if (groupNum > -1) {
    removeFromGroup(groupNum, client);
  }
});

