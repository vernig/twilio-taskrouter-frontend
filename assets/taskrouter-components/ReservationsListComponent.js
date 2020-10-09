/**
 * Class ReservationList 
 */

class ReservationsListComponent {
  /**
   * 
   * @param {*} workerClient WorkerClient Object returned by new Twilio.TaskRouter.Worker(WORKER_TOKEN)
   * @param {*} rootElement DOM target element container for the reservations list
   */
  constructor(workerClient, rootElement) {
    this._workerClient = workerClient;
    this._rootElement = rootElement;
    this._subscribeEvents();
    this._reservationAttributes = ['sid', 'reservationStatus'];
    this._taskAttributes = ['assignmentStatus'];
    // Actions on reservation are based on task status
    this._reservationActions = {
      reserved: [
        {
          label: 'Accept',
          fn: this._acceptReservation,
          class: 'reservation-accept-btn',
        },
        {
          label: 'Reject',
          fn: this._rejectReservation,
          class: 'reservation-reject-btn',
        },
      ],
      assigned: [
        {
          label: 'Complete Task',
          fn: this._completeTask,
          class: 'task-complete-btn',
        },
      ],
      completed: [],
    };

    //   [ 'reserved':
    //     // { label: 'Call', fn: 'call', class: 'btn btn-primary mr-2' },
    //     // { label: 'Conference', fn: 'conference', class: 'btn btn-primary mr-2' },
    //     // { label: 'Dequeue', fn: 'dequeue', class: 'btn btn-primary mr-2' },
    //     // { label: 'Redirect', fn: 'redirect', class: 'btn btn-primary mr-2' },
    //     { label: 'Reject', fn: 'reject', class: 'btn btn-danger mr-2' }
    // }
    //   ];
    this.render();
  }

  _log(message) {
    console.log(message);
  }

  _acceptReservation(reservation) {
    reservation.accept();
  }

  _rejectReservation(reservation) {
    reservation.reject();
  }

  _completeTask(reservation) {
    reservation.task.complete();
  }

  _subscribeEvents() {
    this._workerClient.on('reservation.created', (reservation) => {
      this._log('Reservation created event');
      this.render();
    });

    this._workerClient.on('reservation.accepted', (reservation) => {
      this._log('Reservation accepted event');
      this.render();
    });

    this._workerClient.on('reservation.timeout', (reservation) => {
      this._log('Reservation timeout event');
      this.render();
    });

    this._workerClient.on('reservation.canceled', (reservation) => {
      this._log('Reservation canceled event');
      this.render();
    });
  }

  _renderReservationAttributes(reservation) {
    let attributesContainer = document.createElement('div');
    attributesContainer.classList.add('reservation-attributes-container');

    // Reservation's attributes
    this._reservationAttributes.forEach((key) => {
      let attribute = document.createElement('p');
      attribute.classList.add('reservation-attribute');
      attribute.textContent = `${key}: ${reservation[key]}`;
      attributesContainer.appendChild(attribute);
    });

    // Task's attributes
    this._taskAttributes.forEach((key) => {
      let attribute = document.createElement('p');
      attribute.classList.add('task-attribute');
      attribute.textContent = `task.${key}: ${reservation.task[key]}`;
      attributesContainer.appendChild(attribute);
    });
    return attributesContainer;
  }

  _renderActionButtons(reservation) {
    let actionsContainer = document.createElement('div');
    actionsContainer.classList.add('reservation-actions-container');
    this._reservationActions[reservation.task.assignmentStatus].forEach(
      (action) => {
        let actionButton = document.createElement('button');
        actionButton.type = 'button';
        actionButton.classList = action.class;
        actionButton.textContent = action.label;
        actionButton.onclick = (e) => {
          action.fn(reservation);
          this.render();
        };
        actionsContainer.append(actionButton);
      }
    );
    return actionsContainer;
  }

  render() {
    this._workerClient.fetchReservations((error, reservations) => {
      this._rootElement.innerHTML = '';
      reservations.data.forEach((reservation) => {
        if (
          reservation.reservationStatus !== 'timeout' &&
          reservation.reservationStatus !== 'rejected'
        ) {
          let reservationComponent = document.createElement('div');
          reservationComponent.classList = 'reservation-container';
          reservationComponent.appendChild(
            this._renderReservationAttributes(reservation)
          );
          reservationComponent.appendChild(
            this._renderActionButtons(reservation)
          );
          this._rootElement.prepend(reservationComponent);

          // this._rootElement.innerHTML =
          // `<li class="">Reservation SID: ${
          //   reservation.sid
          // }<br/>Reservation Status: ${
          //   reservation.reservationStatus
          // }<br/>Task Status: ${
          //   reservation.task.assignmentStatus
          // } ${renderReservationButtons(reservation)}</li>` +
          // this._rootElement.innerHTML;
        }
      });
    });
  }
}
