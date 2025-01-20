import DatePicker from '~/components/date-picker/date-picker';

// https://stackoverflow.com/a/58633686
const isoDateFormatter = new Intl.DateTimeFormat('sv-SE', {
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
});

export const DateAutocompletionView = (props: { onCompletion: (next: string) => void }) => {
	return (
		<div class="flex flex-col">
			<div class="self-center py-4">
				<DatePicker
					onChange={(next) => {
						props.onCompletion(isoDateFormatter.format(next));
					}}
				/>
			</div>
		</div>
	);
};
