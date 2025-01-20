import DatePicker from '~/components/date-picker/date-picker';

export const DateAutocompletionView = (props: { onCompletion: (next: string) => void }) => {
	return (
		<div class="flex flex-col">
			<div class="self-center py-4">
				<DatePicker />
			</div>
		</div>
	);
};
