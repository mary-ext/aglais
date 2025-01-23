import DatePicker from '~/components/date-picker/date-picker';

// https://stackoverflow.com/a/58633686
const isoDateFormatter = new Intl.DateTimeFormat('sv-SE', {
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
});

export interface DateAutocompletionViewProps {
	initialCursor?: Date;
	minDate?: Date;
	maxDate?: Date;
	onCompletion: (next: string) => void;
}

const DateAutocompletionView = (props: DateAutocompletionViewProps) => {
	return (
		<>
			<div class="self-center py-4">
				<DatePicker
					initialCursor={props.initialCursor}
					minDate={props.minDate}
					maxDate={props.maxDate}
					onChange={(next) => {
						props.onCompletion(isoDateFormatter.format(next));
					}}
				/>
			</div>
		</>
	);
};

export default DateAutocompletionView;
