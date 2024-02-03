/*
Copyright 2016 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var idbApp = (function () {
  "use strict";
  var dbPromise = idb.open("TodoLists", 2, function (upgradeDB) {
    switch (upgradeDB.oldVersion) {
      case 1:
        console.log("creating product table");
        upgradeDB.createObjectStore("TodoLists", { keyPath: "id" });
    }
  });

  function addTask() {
    dbPromise.then((db) => {
      var tx = db.transaction("TodoLists", "readwrite");
      var store = tx.objectStore("TodoLists");

      var title = document.getElementById("taskTitle").value;
      var hours = Number(document.getElementById("hours").value);
      var minutes = Number(document.getElementById("minutes").value);
      var day = Number(document.getElementById("day").value);
      var month = Number(document.getElementById("month").value);
      var year = Number(document.getElementById("year").value);

      var task = {
        id: new Date().getTime(),
        title: title,
        time: `${hours}:${minutes}`,
        date: `${day}-${month}-${year}`,
        notify: false,
      };

      return store
        .add(task)
        .then(() => {
          console.log("Task added to the store:", task);

          document.getElementById("task-container").innerHTML += `
          <div class="task  position-relative"  data-id="${task.id}">
            <p class="task-title fw-bolder">${title} — ${hours}:${minutes}, ${day}-${month}-${year}.</p>
            <button onclick="idbApp.deleteTask(${task.id})"
              class="close position-absolute top-0 end-0 bg-transparent fs-4 border-0 pt-1">&times;</button>
          </div>`;
          var taskTime = new Date(
            `${year}/${month}/${day} ${hours}:${minutes}:00`
          ).getTime();

          var currentTime = new Date().getTime();
          var timeDiff = taskTime - currentTime;

          console.log(taskTime, currentTime, timeDiff);

          displayNotification(task, timeDiff, task.id);
        })
        .catch((err) => {
          console.error("Could not add task:", err);
        });
    });
  }

  (function () {
    return dbPromise.then((db) => {
      const tx = db.transaction("TodoLists", "readonly");
      const store = tx.objectStore("TodoLists");

      return store
        .getAll()
        .then((tasks) => {
          let taskContainer = document.getElementById("task-container");
          taskContainer.innerHTML = "";
          tasks.forEach((task) => {
            const taskHtml = `
          <div class="task  position-relative" data-id="${task.id}">
            <p class="task-title fw-bolder">${task.title} — ${task.time}, ${task.date}.</p>
            <button onclick="idbApp.deleteTask(${task.id})" 
              class="close position-absolute top-0 end-0 bg-transparent fs-4 border-0 pt-1">&times;</button>
          </div>`;
            taskContainer.innerHTML += taskHtml;
          });
        })
        .catch((err) => {
          console.log(err);
        });
    });
  })();

  function deleteTask(taskId) {
    console.log(taskId);
    const id = Number(taskId);
    dbPromise.then((db) => {
      const tx = db.transaction("TodoLists", "readwrite");
      const store = tx.objectStore("TodoLists");

      return store
        .delete(id)
        .then(() => {
          console.log("Task deleted:", id);
          document.querySelector(`.task[data-id="${id}"]`).remove();
        })
        .catch((err) => {
          console.error("Could not delete task:", err);
        });
    });
  }

  function displayNotification(task, time, id) {
    setTimeout(() => {
      if ("Notification" in window) {
        Notification.requestPermission().then((permission) => {
          if (permission == "granted") {
            console.log("hello from settimeout");
            var notification = new Notification("Task Reminder", {
              body: task.title,
              icon: "../notification-flat.png",
            });
            document
              .querySelector(`.task[data-id="${id}"]`)
              .classList.add("text-decoration-line-through", "text-black-50");

            updateStore(id, true);
          }
        });
      }
    }, time);
  }

  function updateStore(id, done) {
    dbPromise.then((db) => {
      const tx = db.transaction("TodoLists", "readwrite");
      const store = tx.objectStore("TodoLists");

      return store.get(id).then((task) => {
        if (task) {
          task.done = done;
          task.notify = true;
          store.put(task);
        }
      });
    });
  }

  return {
    dbPromise: dbPromise,
    addTask: addTask,
    deleteTask: deleteTask,
  };
})();
