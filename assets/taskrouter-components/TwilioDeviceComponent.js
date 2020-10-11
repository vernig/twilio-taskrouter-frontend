// Assumes Twilio Device is imported, e.g.
// <script src="https://sdk.twilio.com/js/client/v1.12/twilio.js"></script>

var twilioDevice;

class TwilioDeviceComponent {
  /**
   * Constructor
   *
   * @param {string} clientId Twilio Voice Client Id (without "client:")
   * @param {Element} rootElement Root Element for rendering the Component
   *
   */
  constructor(clientId, rootElement) {
    this._clientId = clientId;
    this._rootElement = rootElement;
    this._twilioDevice;
    this._events = {
      error: [],
      incoming: [],
      ready: [],
      connect: [],
      disconnect: [],
    };
    this._config = {
      autoAccept: false,
    };
    this._uistate = 'unregistered';
    this._actions = {
      incoming: [
        {
          caption: 'Answer',
          class: 'twilio-device-button-confirm',
          disabled: false,
          fn: this._anwserCall,
        },
        {
          caption: 'Mute',
          class: 'twilio-device-button-mute',
          disabled: true,
          fn: undefined,
        },
        {
          caption: 'Hangup',
          class: 'twilio-device-button-hangup',
          disabled: true,
          fn: undefined,
        },
      ],
      unregistered: [
        {
          caption: 'Call',
          class: 'twilio-device-button-confirm',
          disabled: true,
          fn: undefined,
        },
        {
          caption: 'Mute',
          class: 'twilio-device-button-mute',
          disabled: true,
          fn: undefined,
        },
        {
          caption: 'Hangup',
          class: 'twilio-device-button-hangup',
          disabled: true,
          fn: undefined,
        },
      ],
      connected: [
        {
          caption: 'Call',
          class: 'twilio-device-button-confirm',
          disabled: true,
          fn: undefined,
        },
        {
          caption: 'Mute',
          class: 'twilio-device-button-mute',
          disabled: false,
          fn: this._mute,
        },
        {
          caption: 'Hangup',
          class: 'twilio-device-button-hangup',
          disabled: false,
          fn: this.hangup,
        },
      ],
      muted: [
        {
          caption: 'Call',
          class: 'twilio-device-button-confirm',
          disabled: true,
          fn: undefined,
        },
        {
          caption: 'Unmute',
          class: 'twilio-device-button-mute',
          disabled: false,
          fn: this._mute,
        },
        {
          caption: 'Hangup',
          class: 'twilio-device-button-hangup',
          disabled: false,
          fn: this.hangup,
        },
      ],
    };
    this._actions['registering'] = this._actions['unregistered'];
    this._actions['ready'] = this._actions['unregistered'];
    this._actions['disconnected'] = this._actions['unregistered'];
    this._connection;

    this._registerTwilioDevice(this._clientId);
  }

  _log(message) {
    console.log(`TwilioDeviceComponent: ${message}`);
  }

  _error(message) {
    console.error(`TwilioDeviceComponent error: ${message}`);
  }

  // Call functions
  _anwserCall() {
    this._connection.accept();
  }

  _mute(event) {
    // TODO: Should i dispatch this event?
    // if (event.target.textContent === 'Mute') {
    //   this._log('Mute Call');
    //   this._uistate = 'muted';
    //   this._connection.mute(true)
    // } else {
    //   this._log('Unmute Call');
    //   this._uistate = 'connected';
    //   this._connection.mute(false)
    // }

    this._connection.mute(!this._connection.isMuted());
    this._uistate = this._connection.isMuted() ? 'muted' : 'connected';
    this._log(`Changing mute status to ${this._uistate}`)
    this.render();
  }

  // Subscribe to TwilioDevice events
  _subscribeEvents() {
    this._twilioDevice.on('ready', (device) => {
      document.body.classList.add('twilio-device-ready');
      this._uistate = 'ready';
      this._dispatchEvent('ready');
    });

    this._twilioDevice.on('error', (error) => {
      this._dispatchEvent('error');
    });

    this._twilioDevice.on('connect', (conn) => {
      this._connection = conn;
      this._uistate = 'connected';
      this._dispatchEvent('connect');
    });

    this._twilioDevice.on('disconnect', (conn) => {
      this._connection = conn;
      this._uistate = 'disconnected';
      this._dispatchEvent('disconnect');
    });

    this._twilioDevice.on('incoming', (conn) => {
      this._uistate = 'incoming';
      this._connection = conn;
      this._dispatchEvent('incoming');
      if (this._config.autoAccept) {
        conn.accept();
      }
    });
  }

  _registerTwilioDevice(clientId) {
    fetch(`/get-client-token?clientId=${clientId}`)
      .then((response) => response.json())
      .then((response) => {
        // Setup Twilio.Device
        this._uistate = 'connecting';
        this._twilioDevice = new Twilio.Device(response.token, {
          codecPreferences: ['opus', 'pcmu'],
          enableRingingState: false,
        });
        this._subscribeEvents();
      });
  }

  _dispatchEvent(eventName) {
    this._log(`Dispatching event: ${eventName}`);
    this.render();
    if (this._events[eventName].length > 0) {
      this._events[eventName].forEach((callback) => callback(error));
    }
  }

  /**
   * Register an handler for an event
   *
   * @param {string} eventName Event name
   * @param {fn} callback Callback function
   */
  on(eventName, callback) {
    if (this._events.hasOwnProperty(eventName)) {
      this._events[eventName].push(callback);
    }
  }

  /**
   * Make an outbound Call with the TwilioDevice
   *
   * @param {string} number Number in E.164
   *
   */
  outboundCall(number) {
    // TODO: check if outbound dialing is enabled
    connection = this._twilioDevice.connect({ toNumber: number });
    // callButton = event.currentTarget;
    // callButton.textContent = 'Calling ...';
    this.render();
  }

  /**
   * Disconnect all ongoing connection
   */
  hangup() {
    if (this._twilioDevice) {
      this._twilioDevice.disconnectAll();
    }
    this.render();
  }

  /**
   * Render component
   */
  render() {
    this._rootElement.innerHTML = '';
    let container = document.createElement('div');
    container.classList = 'twilio-device-container';
    let clientId = document.createElement('div');
    clientId.classList = 'twilio-device-client-id';
    clientId.textContent = `Client id: ${this._clientId}`;
    let status = document.createElement('div');
    status.classList = 'twilio-device-status';
    status.textContent = `Device status: ${this._uistate}`;

    // Actions
    let actionsContainer = document.createElement('div');
    actionsContainer.classList = 'twilio-device-actions-container';
    this._actions[this._uistate].forEach((action) => {
      let btn = document.createElement('button');
      btn.classList = action.class;
      btn.textContent = action.caption;
      btn.disabled = action.disabled;
      if (action.fn) {
        btn.onclick = action.fn.bind(this);
      }
      actionsContainer.appendChild(btn);
    });
    container.append(clientId, status, actionsContainer);
    this._rootElement.appendChild(container);
  }
}
