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
	isSameMonth,
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

const monthFormatter = new Intl.DateTimeFormat('en', { month: 'long' });
const weekdayLongFormatter = new Intl.DateTimeFormat('en', { weekday: 'long' });
const weekdayShortFormatter = new Intl.DateTimeFormat('en', { weekday: 'short' });

const formatDayLabel = (date: Date, sameMonth: boolean) => {
	if (sameMonth) {
		return `${date.getDate()}, ${weekdayLongFormatter.format(date)}`;
	} else {
		return `${monthFormatter.format(date)} ${date.getDate()}, ${weekdayLongFormatter.format(date)}`;
	}
};

const DatePicker = (props: DatePickerProps) => {
	const onChange = props.onChange;

	const today = new Date();

	const [cursor, setDate] = createDerivedSignal(() => {
		return clamp(props.value ?? today, props.minDate, props.maxDate);
	});

	const startMonth = createMemo(() => startOfMonth(cursor()), undefined, {
		equals: isDateEqual,
	});

	const weeks = createMemo(() => {
		const $date = startMonth();

		const start = startOfWeek($date);
		const end = endOfWeek(endOfMonth($date));

		const days: Date[] = [];
		for (let curr = start; isBefore(curr, end); ) {
			days.push(curr);
			curr = addDays(curr, 1);
		}

		const chunks = chunked(days, 7);
		while (chunks.length < 6) {
			chunks.push([]);
		}

		return chunks;
	});

	const navigate = (action: NavigationAction) => {
		setDate(addMonths(startMonth(), action));
	};

	return (
		<div class="flex w-max flex-col gap-4 text-contrast/90">
			<div class="flex items-center gap-2">
				<button
					onClick={() => navigate(NavigationAction.Previous)}
					class="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-contrast-hinted/md active:bg-contrast-hinted/md-pressed"
				>
					<ChevronRightOutlinedIcon class="rotate-180 text-xl" />
				</button>

				<div class="grow text-center font-medium">{monthYearFormatter.format(startMonth())}</div>

				<button
					onClick={() => navigate(NavigationAction.Next)}
					class="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-contrast-hinted/md active:bg-contrast-hinted/md-pressed"
				>
					<ChevronRightOutlinedIcon class="text-xl" />
				</button>
			</div>

			<div class="grid grid-cols-7 gap-2 text-center">
				{
					/* @once */ weeks()[0].map((day) => {
						return (
							<div class="text-xs text-contrast-muted">{/* @once */ weekdayShortFormatter.format(day)}</div>
						);
					})
				}

				<div
					class="contents"
					onKeyDown={(ev) => {
						//
					}}
				>
					{weeks().map((week) => {
						return week.map((day) => {
							const isInside = isSameMonth(day, startMonth());
							const isToday = isSameDate(day, today);

							return (
								<button
									tabindex={isSameDate(day, cursor()) ? 0 : -1}
									aria-label={/* @once */ formatDayLabel(day, isInside)}
									class={
										`h-10 w-10 rounded-full hover:bg-contrast/md active:bg-contrast/md-pressed` +
										(!isInside ? ` text-contrast-muted` : ``) +
										(isToday ? ` border-2 border-accent font-bold` : ``)
									}
									onClick={onChange && (() => onChange(day))}
								>
									{/* @once */ getDate(day)}
								</button>
							);
						});
					})}
				</div>
			</div>
		</div>
	);
};

export default DatePicker;
