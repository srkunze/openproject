import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { I18nService } from 'core-app/core/i18n/i18n.service';
import {
  map,
  skip,
} from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { UserPreferencesService } from 'core-app/features/user-preferences/state/user-preferences.service';

@Component({
  selector: 'op-reminder-settings-daily-time',
  templateUrl: './reminder-settings-daily-time.component.html',
  styleUrls: ['./reminder-settings-daily-time.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReminderSettingsDailyTimeComponent {
  // All times that are available in a day with a 1 hour gap between each.
  // ['00:00', '01:00', ..., '24:00']
  public availableTimes:string[] = ReminderSettingsDailyTimeComponent.setupAvailableTimes();

  // The times (hours) that the user deactivated. Those are only stored within the component
  // as the inactive hours are not persisted. This list is then interleaved with the list
  // of times stored in the backend. As the order of the times should be kept,
  // the position needs to be maintained.
  // Upon a reload of the page, it is accepted to loose this information.
  public inactiveTimes:Array<{ position:number, time:string }> = [];

  // Hours suggested if a new time is added by a user.
  public suggestedTimes = ['08:00', '12:00', '15:00', '18:00'];

  // The daily reminders with the first value skipped. Only used
  // for that skipping as the first value is produced by the front end (default value).
  public dailyReminders$ = this.storeService.query.dailyReminders$.pipe(skip(1));

  // Whether the reminder are active at all.
  public enabled$ = this.storeService.query.dailyRemindersEnabled$;

  // The active times as present in the store interleaved with the inactive
  // times.
  public selectedTimes$ = this
    .storeService
    .query
    .dailyRemindersTimes$
    .pipe(map((times) => {
      const activeTimes = Array(...times);

      this
        .inactiveTimes
        .sort((a, b) => a.position - b.position)
        .forEach((inactiveTime) => {
          activeTimes.splice(inactiveTime.position, 0, inactiveTime.time);
        });

      return activeTimes;
    }));

  // Times that are truly active:
  // * the reminders are not disabled completely
  // * the times are not inactive individually.
  public activeTimes$ = combineLatest([
    this.storeService.query.dailyRemindersEnabled$,
    this.storeService.query.dailyRemindersTimes$,
  ]).pipe(map(([enabled, times]) => (enabled ? times : [])));

  // Times can only be removed if the element is active and if there is more than one time present.
  public timeRemovable$ = combineLatest([
    this.storeService.query.dailyRemindersEnabled$,
    this.selectedTimes$,
  ]).pipe(map(([enabled, selectedTimes]) => enabled && selectedTimes.length > 1));

  // Times can not be added if the element is disabled or if all the possible times have already been added (active or not).
  public nonAddable$ = combineLatest([
    this.storeService.query.dailyRemindersEnabled$,
    this.selectedTimes$,
  ]).pipe(map(([enabled, selectedTimes]) => !enabled || selectedTimes.length === this.availableTimes.length));

  text = {
    timeLabel: (counter:number):string => this.I18n.t('js.reminders.settings.daily.time_label', { counter }),
    addTime: this.I18n.t('js.reminders.settings.daily.add_time'),
    enable: this.I18n.t('js.reminders.settings.daily.enable'),
  };

  constructor(
    private I18n:I18nService,
    private storeService:UserPreferencesService,
  ) { }

  addTime(selectedTimes:string[]):void {
    const time = this.firstAvailableSuggested(selectedTimes) || this.firstAfterSelected(selectedTimes);

    if (time) {
      this.storeTimes(selectedTimes.concat(time));
    }
  }

  changeTime(newTime:string, selectedTimes:string[], index:number):void {
    selectedTimes.splice(index, 1, newTime);

    this.storeTimes(selectedTimes);
  }

  isActive(time:string):boolean {
    return !this.inactiveTimes.find((inactive) => inactive.time === time);
  }

  removeTime(selectedTimes:string[], index:number):void {
    this.inactiveTimes = this
      .inactiveTimes
      .filter((inactiveTime) => inactiveTime.time !== selectedTimes[index]);

    this.inactiveTimes
      .forEach((inactiveTime) => {
        if (inactiveTime.position > index) {
          // eslint-disable-next-line no-param-reassign
          inactiveTime.position -= 1;
        }
      });

    selectedTimes.splice(index, 1);

    if (selectedTimes.length === 1) {
      this.inactiveTimes = [];
    }

    // Activate the first time if none is active.
    if (selectedTimes.length === this.inactiveTimes.length) {
      this.inactiveTimes.shift();
    }

    this.storeTimes(selectedTimes);
  }

  toggleEnabled(enabled:boolean):void {
    this.storeService.store.update(({ dailyReminders }) => (
      {
        dailyReminders: {
          ...dailyReminders,
          enabled,
        },
      }
    ));
  }

  toggleActive(active:boolean, index:number, selectedTimes:string[]):void {
    if (!active) {
      this.inactiveTimes.push({ position: index, time: selectedTimes[index] });
    } else {
      this.inactiveTimes = this.inactiveTimes.filter((inactiveTime) => inactiveTime.time !== selectedTimes[index]);
    }

    this.storeTimes(selectedTimes);
  }

  timeLabel(time:string):string {
    return this
      .I18n
      .toTime(
        'time.formats.time',
        ReminderSettingsDailyTimeComponent.dateForHour(parseInt(time.split(':')[0], 10)),
      );
  }

  private storeTimes(selectedTimes:string[]) {
    this.storeService.store.update(({ dailyReminders }) => (
      {
        dailyReminders: {
          ...dailyReminders,
          times: selectedTimes.filter((selected) => !this.inactiveTimes.map((inactive) => inactive.time).includes(selected)), // .map((selected) => selected.time),
        },
      }));
  }

  private firstAvailableSuggested(selectedTimes:string[]) {
    return this.availableTimes.find((v) => this.suggestedTimes.includes(v) && !selectedTimes.includes(v));
  }

  private firstAfterSelected(selectedTimes:string[]) {
    const indexLastSelected = this.availableTimes.indexOf(selectedTimes[selectedTimes.length - 1]);

    for (let i = indexLastSelected; i < 24 + indexLastSelected; i++) {
      if (!selectedTimes.includes(this.availableTimes[i % 24])) {
        return this.availableTimes[i % 24];
      }
    }

    return null;
  }

  private static setupAvailableTimes() {
    return Array.from({ length: 24 }, (v, i) => ReminderSettingsDailyTimeComponent
      .dateForHour(i)
      .toLocaleTimeString('en-US', { hour12: false, hour: 'numeric', minute: 'numeric' }));
  }

  private static dateForHour(hour:number) {
    const date = new Date();
    date.setTime(1000 * 60 * 60 * (hour - 1));

    return date;
  }
}
