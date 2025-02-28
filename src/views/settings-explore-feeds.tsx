import { createMemo } from 'solid-js';

import { dequal } from '~/api/utils/dequal';

import { openModal, useModalContext } from '~/globals/modals';

import { createDerivedSignal } from '~/lib/hooks/derived-signal';
import { Key } from '~/lib/keyed';
import DraggablePreview from '~/lib/pragmatic-dnd/DraggablePreview';
import DropIndicator from '~/lib/pragmatic-dnd/DropIndicator';
import { Reorderable, useReorderableItem } from '~/lib/pragmatic-dnd/reorder';
import type {
	SavedFeed,
	SavedGeneratorFeed,
	SavedListFeed,
	SavedSearchFeed,
} from '~/lib/preferences/account';
import { useSession } from '~/lib/states/session';
import { assertUnreachable } from '~/lib/utils/invariant';
import { snapshot } from '~/lib/utils/state';

import Avatar from '~/components/avatar';
import Button from '~/components/button';
import IconButton from '~/components/icon-button';
import MagnifyingGlassOutlinedIcon from '~/components/icons-central/magnifying-glass-outline';
import MoreHorizOutlinedIcon from '~/components/icons-central/more-horiz-outline';
import PinOutlinedIcon from '~/components/icons-central/pin-outline';
import PinSolidIcon from '~/components/icons-central/pin-solid';
import * as Menu from '~/components/menu';
import * as Page from '~/components/page';

const ExploreFeedsSettingsPage = () => {
	const { currentAccount } = useSession();

	const currentFeeds = createMemo(() => {
		return currentAccount ? snapshot(currentAccount.preferences.feeds) : [];
	});

	const [feeds, setFeeds] = createDerivedSignal(currentFeeds);

	const isEqual = createMemo(() => {
		return dequal(currentFeeds(), feeds());
	});

	const apply = () => {
		if (currentAccount) {
			currentAccount.preferences.feeds = feeds();
		}
	};

	return (
		<>
			<Page.Header>
				<Page.HeaderAccessory>
					<Page.Back to="/explore" />
				</Page.HeaderAccessory>

				<Page.Heading title="My saved feeds" />

				<Page.HeaderAccessory>
					{!isEqual() && (
						<Button
							variant="ghost"
							onClick={() => {
								setFeeds(currentFeeds());
							}}
						>
							Reset
						</Button>
					)}

					<Button disabled={isEqual()} onClick={apply} variant="primary">
						Save
					</Button>
				</Page.HeaderAccessory>
			</Page.Header>

			<div class="flex flex-col pb-4">
				<div class="shrink-0 p-4">
					<p class="text-pretty text-sm text-contrast-muted">
						Your saved feeds appear in the Explore page. You can rearrange them, pin your favorites to the
						Home page, or remove them entirely.
					</p>
				</div>

				<Reorderable list={feeds()} onReorder={setFeeds}>
					<Key
						each={feeds()}
						by={getFeedId}
						fallback={<p class="py-6 text-center text-base font-medium">No saved feeds yet.</p>}
					>
						{(feed, index) => {
							const draggable = useReorderableItem({
								index,
								renderPreview: true,
							});

							const type = feed().type;

							const isPinned = createMemo(() => {
								switch (type) {
									case 'generator':
									case 'list': {
										const $feed = feed() as SavedGeneratorFeed | SavedListFeed;
										return $feed.pinned;
									}
									default: {
										return false;
									}
								}
							});

							const name = createMemo((): string => {
								switch (type) {
									case 'generator': {
										return (feed() as SavedGeneratorFeed).info.displayName;
									}
									case 'list': {
										return (feed() as SavedListFeed).info.name;
									}
									case 'search': {
										const $feed = feed() as SavedSearchFeed;
										return $feed.name || $feed.query;
									}
									default: {
										assertUnreachable(type);
									}
								}
							});

							return (
								<div
									ref={(node) => {
										draggable.refs.element(node);
									}}
									class="relative flex shrink-0 cursor-grab select-none items-center gap-4 px-4 py-3 hover:bg-contrast/sm-pressed"
								>
									<DropIndicator edge={draggable.edge} />
									<DraggablePreview container={draggable.preview}>
										<div class="flex max-w-64 items-center gap-2 rounded border border-outline bg-background p-2">
											{type === 'generator' || type === 'list' ? (
												<Avatar
													type={type}
													src={(feed() as SavedGeneratorFeed | SavedListFeed).info.avatar}
													size="sm"
												/>
											) : type === 'search' ? (
												<div class="my-0.5 grid h-6 w-6 place-items-center rounded-md bg-accent text-sm text-accent-fg">
													<MagnifyingGlassOutlinedIcon />
												</div>
											) : null}

											<span class="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold">
												{name()}
											</span>
										</div>
									</DraggablePreview>

									{type === 'generator' || type === 'list' ? (
										<Avatar
											type={type}
											src={(feed() as SavedGeneratorFeed | SavedListFeed).info.avatar}
											class="pointer-events-none my-0.5"
										/>
									) : type === 'search' ? (
										<div class="my-0.5 grid h-9 w-9 place-items-center rounded-md bg-accent text-xl text-accent-fg">
											<MagnifyingGlassOutlinedIcon />
										</div>
									) : null}

									<div class="min-w-0 grow">
										<p class="text-sm font-bold">{name()}</p>

										<p class="overflow-hidden text-ellipsis whitespace-nowrap text-de text-contrast-muted empty:hidden">
											{(() => {
												switch (type) {
													case 'generator': {
														return `Feed by @${(feed() as SavedGeneratorFeed).info.creator.handle}`;
													}
													case 'list': {
														return `User list by @${(feed() as SavedListFeed).info.creator.handle}`;
													}
												}
											})()}
										</p>
									</div>

									<div class="-mx-2 flex items-center gap-2 empty:hidden">
										{(type === 'generator' || type === 'list') && (
											<IconButton
												icon={!isPinned() ? PinOutlinedIcon : PinSolidIcon}
												title={!isPinned() ? `Pin` : `Unpin`}
												variant={!isPinned() ? 'ghost' : 'accent'}
												onClick={() => {
													const $feed = feed() as SavedGeneratorFeed | SavedListFeed;
													setFeeds(feeds().with(index(), { ...$feed, pinned: !$feed.pinned }));
												}}
											/>
										)}

										<IconButton
											icon={MoreHorizOutlinedIcon}
											title="Actions"
											onClick={(ev) => {
												const anchor = ev.currentTarget;

												openModal(() => {
													const { close } = useModalContext();

													return (
														<Menu.Container anchor={anchor}>
															<Menu.Item
																label="Move up"
																disabled={!draggable.canMove(-1)}
																onClick={() => {
																	close();
																	draggable.move(-1);
																}}
															/>

															<Menu.Item
																label="Move down"
																disabled={!draggable.canMove(1)}
																onClick={() => {
																	close();
																	draggable.move(1);
																}}
															/>

															<Menu.Divider />

															<Menu.Item
																label="Remove"
																variant="danger"
																onClick={() => {
																	close();
																	setFeeds(feeds().toSpliced(index(), 1));
																}}
															/>
														</Menu.Container>
													);
												});
											}}
										/>
									</div>
								</div>
							);
						}}
					</Key>
				</Reorderable>
			</div>
		</>
	);
};

export default ExploreFeedsSettingsPage;

const getFeedId = (feed: SavedFeed) => {
	switch (feed.type) {
		case 'generator':
		case 'list': {
			return `${feed.type}:${feed.info.uri}`;
		}
		case 'search': {
			return `${feed.type}:${feed.query}:${feed.kind}`;
		}
	}
};
