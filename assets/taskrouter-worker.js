var workerComponent;
var reservationsListComponent;

// Sample code for customizing the worker component
function customizeWorkerComponent(component) {
  // Add new worker's attribute to be show in the component
  // As example, we pourposly use a bootstrap class for that.
  // Alternative you can use the default class `worker-attribute`
  component.workerAttributes.push({
    label: 'sid',
    key: 'sid',
    class: 'list-group-item',
  });
}

function registerWorker(workerSid) {
  fetch('/get-tr-token?workerSid=' + workerSid)
    .then((response) => response.text())
    .then((response) => {
      const WORKER_TOKEN = response;
      workerComponent = new WorkerComponent(document.getElementById('worker'));
      customizeWorkerComponent(workerComponent);
      workerComponent.init(WORKER_TOKEN).then((workerInfo) => {
        reservationsList = new ReservationsListComponent(
          workerComponent.getClient(),
          document.getElementById('reservations-group')
        );
      });
      workerComponent.on('error', (error) => {
        swal.fire({ text: error, icon: 'error' });
      });
    });
}

function registerTwilioDevice() {
  const twilioDeviceComponent = new TwilioDeviceComponent(
    'gverni',
    document.getElementById('twilio-device')
  );
}

if (!WORKER_SID) {
  window.alert(
    'Provide worker sid in the url: e.g. http://yourserver.com/worker.html?workerSid=WKXXXX'
  );
  // log('WORKER_SID variable missing!', 'error');
} else {
  registerWorker(WORKER_SID);
  registerTwilioDevice()
}
