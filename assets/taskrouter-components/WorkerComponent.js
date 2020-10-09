class WorkerComponent {
  constructor(rootElement) {
    // Init default properties
    this._workerClient;
    this._worker;
    this._activityList;
    this._events = {
      error: [],
    };
    this.workerAttributes = [
      {
        label: 'Name',
        key: 'friendlyName',
        class: 'worker-attribute',
      },
      {
        label: 'Activity',
        key: 'activityName',
        class: 'worker-attribute',
      },
      {
        label: 'Available',
        key: 'available',
        class: 'worker-attribute',
      },
    ];
    this.workerActions = [
      {
        caption: 'Toggle Availability',
        fn: this._toggleAvailability,
        class: 'worker-action-btn',
      },
    ];

    // Init istance properties
    this._rootElement = rootElement;
  }

  on(eventName, callback) {
    if (this._events.hasOwnProperty(eventName)) {
      this._events[eventName].push(callback);
    }
  }

  _log(message) {
    console.log(message);
  }

  _error(error) {
    // TODO: better handling of errors
    console.log(error);
    if (this._events['error'].length > 0) {
      this._events['error'].forEach((callback) => callback(error));
    }
  }

  _toggleAvailability() {
    let newStatus = {
      ActivitySid: this._worker.available
        ? this._activityList.offline
        : this._activityList.available,
    };
    this._workerClient.update(newStatus, (error, worker) => {
      if (error) {
        error(error);
      } else {
        this._worker = worker;
        this.render();
      }
    });
  }

  _getActivityList() {
    if (this._activityList) {
      return Promise.resolve(this._activityList);
    } else {
      return new Promise((resolve, reject) => {
        this._workerClient.activities.fetch((error, activityList) => {
          if (error) {
            reject(error);
          } else {
            this._activityList = activityList;
            resolve(activityList);
          }
        });
      });
    }
  }

  _createActivityListDropdown() {
    let span = document.createElement('div');
    span.classList = 'worker-activity-list-container';

    let label = document.createElement('label');
    label.for = 'worker-activity-list';
    label.textContent = 'Change worker activity:';

    let select = document.createElement('select');
    select.classList = 'worker-activity-list';
    select.id = 'worker-activity-list';

    this._activityList.data.forEach((activity) => {
      let option = document.createElement('option');
      option.value = activity.sid;
      option.textContent = activity.friendlyName;
      option.selected = this._worker.activitySid === activity.sid;
      select.append(option);
    });

    select.addEventListener('change', (e) => {
      this.setActivity(e.target.value);
    });

    span.append(label, select);
    return span;
  }

  setActivity(ActivitySid) {
    return new Promise((resolve, reject) => {
      this._workerClient.update({ ActivitySid }, (error, worker) => {
        if (error) {
          this.render();
          this._error(error.message);
          reject(error);
        } else {
          // Rendering is done in the activity.update event
          resolve(worker);
        }
      });
    });
  }

  _registerEvents() {
    let postEventHandler = function (event, worker) {
      this._log(`Worker Event: ${event}`);
      this._worker = worker;
      this.render();
    }.bind(this);

    this._workerClient.on('activity.update', (worker) => {
      postEventHandler('activity.update', worker);
    });

    this._workerClient.on('attributes.update', (worker) => {
      postEventHandler('attributes.update', worker);
    });
  }

  init(token) {
    return new Promise((resolve, reject) => {
      this._workerClient = new Twilio.TaskRouter.Worker(token);
      this._workerClient.on('ready', (worker) => {
        this._worker = worker;
        this._getActivityList().then(() => {
          this.render();
          this._registerEvents();
          resolve(worker);
        });
      });

      this._workerClient.on('error', (worker) => {
        this._render();
        reject(error);
      });
    });
  }

  /**
   * get Worker Client
   */
  getClient() {
    return this._workerClient;
  }

  render() {
    this._rootElement.innerHTML = '';
    // Render Attributes
    this.workerAttributes.forEach((attribute) => {
      let attributeElement = document.createElement('DIV');
      attributeElement.classList = attribute.class;
      attributeElement.innerHTML = `<strong>${attribute.label}:</strong> ${
        this._worker[attribute.key]
      }`;
      this._rootElement.append(attributeElement);
    });
    // Render Actions
    let actionsContainer = document.createElement('DIV');
    actionsContainer.classList = 'worker-actions-container';
    actionsContainer.append(this._createActivityListDropdown());
    this.workerActions
    this._rootElement.append(actionsContainer);
  }
}
