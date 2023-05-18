import {
  Service,
  PlatformAccessory,
  PlatformConfig,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
} from 'homebridge';
import { BlindsHomebridgePlatform } from './platform';
import {CharacteristicValue} from 'hap-nodejs/dist/types';
import {StatusResponse} from './api';
import {fetch} from './fetch';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class BlindsPlatformAccessory {
  private readonly host: string;
  private service: Service;

  constructor(
    private readonly config: PlatformConfig,
    private readonly platform: BlindsHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // Set configuration properties
    this.host = config.host;

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Tomasz Mikus')
      .setCharacteristic(this.platform.Characteristic.Model, 'Blinds')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, '000-000-001');

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = (
      this.accessory.getService(this.platform.Service.WindowCovering)
      || this.accessory.addService(this.platform.Service.WindowCovering)
    );

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.exampleDisplayName);

    this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition)
      .on('get', this.getCurrentPositionCharacteristic);

    this.service.getCharacteristic(this.platform.Characteristic.PositionState)
      .on('get', this.getPositionStateCharacteristic);

    this.service.getCharacteristic(this.platform.Characteristic.TargetPosition)
      .on('get', this.getTargetPositionCharacteristic)
      .on('set', this.setTargetPositionCharacteristic);
  }

  getUrl = (action?: string) => {
    return 'http://' + this.host + (action || '/');
  };

  getCurrentPositionCharacteristic = async (next: CharacteristicGetCallback) => {
    // TODO: Buffer the status
    try {
      const response = await fetch(this.getUrl());
      const json = (await response.json()) as StatusResponse;
      const currentPosition = json.currentPosition;
      this.platform.log.debug('Current position: ' + currentPosition);
      next(null, currentPosition);
    } catch (ex) {
      const err = ex as Error;
      this.platform.log.error('Error while getting current position: ' + err.toString());
      next(err);
    }
  };

  getPositionStateCharacteristic = async (next: CharacteristicGetCallback) => {
    // TODO: Buffer the status
    try {
      const response = await fetch(this.getUrl());
      const json = (await response.json()) as StatusResponse;
      const state = json.state;
      this.platform.log.debug('Current state: ' + state);
      switch (state) {
        case 'opening':
          next(null, this.platform.Characteristic.PositionState.INCREASING);
          break;
        case 'closing':
          next(null, this.platform.Characteristic.PositionState.DECREASING);
          break;
        case 'stopped':
          next(null, this.platform.Characteristic.PositionState.STOPPED);
          break;
        default:
          next(null, this.platform.Characteristic.PositionState.STOPPED);
      }
    } catch (ex) {
      const err = ex as Error;
      this.platform.log.error('Error while getting state: ' + err.toString());
      next(err);
    }
  };

  getTargetPositionCharacteristic = async (next: CharacteristicGetCallback) => {
    // TODO: Buffer the status
    try {
      const response = await fetch(this.getUrl());
      const json = (await response.json()) as StatusResponse;
      const targetPosition = json.targetPosition;
      this.platform.log.debug('Target position: ' + targetPosition);
      next(null, targetPosition);
    } catch (ex) {
      const err = ex as Error;
      this.platform.log.error('Error while getting target position: ' + err.toString());
      next(err);
    }
  };

  setTargetPositionCharacteristic = async (value: CharacteristicValue, next: CharacteristicSetCallback) => {
    try {
      await fetch(this.getUrl('/position'), {
        body: value.toString(),
        method: 'POST',
      });
      next();
    } catch (ex) {
      const err = ex as Error;
      this.platform.log.error('Error while setting target position: ' + err.toString());
      next(err);
    }
  };
}
