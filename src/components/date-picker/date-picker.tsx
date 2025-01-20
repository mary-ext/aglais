import { createMemo } from 'solid-js';

import { chunked } from '~/api/utils/misc';

import { createDerivedSignal } from '~/lib/hooks/derived-signal';

import ChevronRightOutlinedIcon from '../icons-central/chevron-right-outline';

import {
	addDays,
	addMonths,
	clamp,
	endOfMonth,
	endOfWeek,
	getDate,
	isBefore,
	isSameDate,
	startOfMonth,
	startOfWeek,
} from './utils/date';

export interface DatePickerProps {
	value?: Date;
	minDate?: Date;
	maxDate?: Date;
	onChange?: (next: Date) => void;
}

const isDateEqual = (a: Date | undefined, b: Date | undefined) => {
	return a?.getTime() === b?.getTime();
};

const enum NavigationAction {
	Previous = -1,
	Next = 1,
}

const monthYearFormatter = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' });

const weekdayLongFormatter = new Intl.DateTimeFormat('en', { weekday: 'long' });
const weekdayShortFormatter = new Intl.DateTimeFormat('en', { weekday: 'short' });

const formatDayLabel = (date: Date) => {
	return `${date.getDate()}, ${weekdayLongFormatter.format(date)}`;
};

const DatePicker = (props: DatePickerProps) => {
	const onChange = props.onChange;

	const today = new Date();

	const [cursor, setCursor] = createDerivedSignal(() => {
		return clamp(props.value ?? today, props.minDate, props.maxDate);
	});

	const startMonth = createMemo(() => startOfMonth(cursor()), undefined, {
		equals: isDateEqual,
	});

	const grid = createMemo((): { offset: number; weeks: Date[][] } => {
		const $date = startMonth();

		const start = $date;
		const end = endOfMonth($date);

		const startWeek = startOfWeek(start);
		const firstWeekend = 7 - start.getDay();
		const offset = start.getDay() - startWeek.getDay();

		const days: Date[] = [];
		for (let curr = start; isBefore(curr, end); ) {
			days.push(curr);
			curr = addDays(curr, 1);
		}

		const weeks = [days.slice(0, firstWeekend), ...chunked(days.slice(firstWeekend), 7)];
		while (weeks.length < 6) {
			weeks.push([]);
		}

		return { offset, weeks };
	});

	const navigate = (action: NavigationAction) => {
		setCursor(addMonths(startMonth(), action));
	};

	return (
		<div class="flex w-max flex-col text-contrast/85">
			<div class="mb-4 flex items-center gap-2">
				<button
					onClick={() => navigate(NavigationAction.Previous)}
					class="grid h-10 w-10 shrink-0 place-items-center rounded-full outline-2 -outline-offset-2 outline-accent hover:bg-contrast-hinted/md focus-visible:outline active:bg-contrast-hinted/md-pressed"
				>
					<ChevronRightOutlinedIcon class="rotate-180 text-xl" />
				</button>

				<div class="grow text-center font-medium">{monthYearFormatter.format(startMonth())}</div>

				<button
					onClick={() => navigate(NavigationAction.Next)}
					class="grid h-10 w-10 shrink-0 place-items-center rounded-full outline-2 -outline-offset-2 outline-accent hover:bg-contrast-hinted/md focus-visible:outline active:bg-contrast-hinted/md-pressed"
				>
					<ChevronRightOutlinedIcon class="text-xl" />
				</button>
			</div>

			<div class="grid grid-cols-7 gap-2 text-center">
				<div class="contents">
					{(() => {
						return grid().weeks[1].map((day) => {
							return (
								<div class="text-xs text-contrast-muted">{/* @once */ weekdayShortFormatter.format(day)}</div>
							);
						});
					})()}
				</div>

				<div
					class="contents"
					onKeyDown={(ev) => {
						const current = cursor();
						let next: Date | undefined;

						switch (ev.key) {
							case 'ArrowLeft': {
								next = addDays(current, -1);
								break;
							}
							case 'ArrowRight': {
								next = addDays(current, 1);
								break;
							}
							case 'ArrowUp': {
								next = addDays(current, -7);
								break;
							}
							case 'ArrowDown': {
								next = addDays(current, 7);
								break;
							}
							case 'Home': {
								next = startOfWeek(current);
								break;
							}
							case 'End': {
								next = endOfWeek(current);
								break;
							}
						}

						if (next) {
							ev.preventDefault();

							setCursor(clamp(next, props.minDate, props.maxDate));

							const button = ev.currentTarget.querySelector<HTMLButtonElement>('button[tabindex="0"]');
							button?.focus();
						}
					}}
				>
					{(() => {
						const { offset, weeks } = grid();

						return weeks.map((week, i) => {
							if (week.length === 0) {
								return [<div class="col-span-7 h-10"></div>];
							}

							return week.map((day, j) => {
								const isToday = isSameDate(day, today);

								const date = getDate(day);

								return (
									<button
										tabindex={isSameDate(day, cursor()) ? 0 : -1}
										aria-label={/* @once */ formatDayLabel(day)}
										class={
											`h-10 w-10 rounded-full outline-2 -outline-offset-2 outline-accent hover:bg-contrast/md focus-visible:outline active:bg-contrast/md-pressed` +
											(isToday ? ` border border-outline-lg font-medium text-contrast` : ``)
										}
										style={{ 'grid-column-start': i == 0 && j === 0 ? offset + 1 : '' }}
										onClick={onChange && (() => onChange(day))}
									>
										{date}
									</button>
								);
							});
						});
					})()}
				</div>
			</div>
		</div>
	);
};

export default DatePicker;
