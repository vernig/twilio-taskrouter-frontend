var workerComponent;
var reservationsListComponent;

// Sample code for customizing the worker component
function customizeWorkerComponent(component) {
  // Add (Bootstrap) style to default shown attributes 
  component.workerAttributes.forEach((attribute) => {
    attribute.class += ' list-group-item';
  });
  // Add new worker's attribute to be show in the component 
  component.workerAttributes.push({
    label: 'sid',
    key: 'sid',
    class: ' list-group-item',
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

if (!WORKER_SID) {
  window.alert(
    'Provide worker sid in the url: e.g. http://yourserver.com/worker.html?workerSid=WKXXXX'
  );
  // log('WORKER_SID variable missing!', 'error');
} else {
  registerWorker(WORKER_SID);
}
