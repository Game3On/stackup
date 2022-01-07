import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import {
  PageContainer,
  AppContainer,
  Head,
  Search,
  AccountTab,
  List,
  UserCard,
  ExploreTabMockup,
  Notifications,
} from '../src/components';
import {
  useAccountStore,
  accountHomePageSelector,
  useSearchStore,
  searchHomePageSelector,
  useWalletStore,
  walletHomePageSelector,
  useActivityStore,
  activityHomePageSelector,
  useOnboardStore,
  onboardHomePageSelector,
  useRecoverStore,
  recoverHomePageSelector,
  useNotificationStore,
  notificationHomePageSelector,
} from '../src/state';
import { useAuthChannel, useLogout } from '../src/hooks';
import { getToUserFromActivity } from '../src/utils/activity';
import { types } from '../src/utils/events';
import { Routes } from '../src/config';
import { EVENTS, logEvent } from '../src/utils/analytics';

const tabs = {
  EXPLORE: 0,
  PAY: 1,
};

const loadingList = [
  <UserCard
    key="loading-card-1"
    isLoading
    isFirst
    username="username"
    preview="preview"
    timestamp={new Date()}
  />,
  <UserCard
    key="loading-card-2"
    isLoading
    username="username"
    preview="preview"
    timestamp={new Date()}
  />,
  <UserCard
    key="loading-card-3"
    isLoading
    isLast
    username="username"
    preview="preview"
    timestamp={new Date()}
  />,
];

export default function Home() {
  const {
    enabled,
    loading: accountLoading,
    user,
    wallet,
    accessToken,
  } = useAccountStore(accountHomePageSelector);
  const {
    loading: searchLoading,
    searchData,
    searchByUsername,
    fetchNextPage,
    hasMore,
    selectResult,
    clearSearchData,
  } = useSearchStore(searchHomePageSelector);
  const { loading: walletLoading, balance, fetchBalance } = useWalletStore(walletHomePageSelector);
  const {
    loading: activityLoading,
    activityList,
    fetchActivities,
    selectActivity,
    updateActivityListFromChannel,
  } = useActivityStore(activityHomePageSelector);
  const {
    loading: notificationLoading,
    notifications: savedNotifications,
    fetchNotifications,
    deleteNotification,
  } = useNotificationStore(notificationHomePageSelector);
  const { clear: clearOnboardData } = useOnboardStore(onboardHomePageSelector);
  const { clear: clearRecover, selectGuardianRequest } = useRecoverStore(recoverHomePageSelector);
  const logout = useLogout();
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabIndex, setTabIndex] = useState(tabs.EXPLORE);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    setNotifications(savedNotifications);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedNotifications]);

  useEffect(() => {
    router.prefetch(Routes.ACTIVITY);
    router.prefetch(Routes.RECOVER_APPROVE_REQUEST);
  }, [router]);

  useEffect(() => {
    if (!enabled) return;
    if (!user.isOnboarded) {
      router.push(Routes.ONBOARD_RECOVERY);
      return;
    }

    clearOnboardData();
    clearRecover();
    fetchActivities({ userId: user.id, accessToken: accessToken.token });
    fetchNotifications({ userId: user.id, accessToken: accessToken.token });
    fetchBalance(wallet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useAuthChannel((event, data) => {
    if (event === types.newPayment) {
      updateActivityListFromChannel(data, { userId: user.id, accessToken: accessToken.token });
      fetchBalance(wallet);
    } else if (event === types.recoverAccount) {
      fetchNotifications({ userId: user.id, accessToken: accessToken.token });
    }
  });

  const onNotificationClick = async (notification) => {
    if (notification.type === types.recoverAccount) {
      selectGuardianRequest({ notificationId: notification.id, ...notification.data });
      router.push(Routes.RECOVER_APPROVE_REQUEST);
    }
  };

  const onDeleteNotification = async (notification) => {
    if (!enabled) return;

    deleteNotification(notification.id, { userId: user.id, accessToken: accessToken.token });
  };

  const onSearch = async (query) => {
    if (!enabled) return;

    setTabIndex(tabs.PAY);
    setShowSearch(true);
    setSearchQuery(query);
    searchByUsername(query, { userId: user.id, accessToken: accessToken.token });
    logEvent(EVENTS.SEARCH_START);
  };

  const onClear = async () => {
    setShowSearch(false);
    setSearchQuery('');
    clearSearchData();
    logEvent(EVENTS.SEARCH_CLEAR);
  };

  const searchResultsNextHandler = async () => {
    fetchNextPage(searchQuery, { userId: user.id, accessToken: accessToken.token });
  };

  const activityNextHandler = async () => {
    // TODO: Fetch next activity page
  };

  const logoutHandler = async () => {
    logout();
    logEvent(EVENTS.LOGOUT);
  };

  const onSearchResultHandler = (result) => {
    selectResult(result);
    logEvent(EVENTS.GO_TO_SEARCH_RESULT);
    router.push(Routes.ACTIVITY);
  };

  const onActivityHandler = (activity) => {
    selectActivity(activity);
    logEvent(EVENTS.GOT_TO_ACTIVITY_ITEM);
    router.push(Routes.ACTIVITY);
  };

  const renderSearchResults = (results = []) => {
    return results.map((result, i) => {
      return (
        <UserCard
          key={`search-result-list-item-${i}`}
          isFirst={i === 0}
          isLast={i === results.length - 1}
          username={result.username}
          onClick={() => onSearchResultHandler(result)}
        />
      );
    });
  };

  const renderActivityList = (results = []) => {
    return results.map((result, i) => {
      const toUser = getToUserFromActivity(result, user.id);
      return (
        <UserCard
          key={`activity-list-item-${i}`}
          isFirst={i === 0}
          isLast={i === results.length - 1}
          username={toUser.username}
          onClick={() => onActivityHandler(result)}
          preview={result.preview}
          timestamp={result.updatedAt}
        />
      );
    });
  };

  const handleTabsChange = (index) => {
    setTabIndex(index);
  };

  return (
    <>
      <Head title="Stackup | Home" />

      <PageContainer>
        <Search
          onSearch={onSearch}
          onClear={onClear}
          rightItem={
            <Notifications
              isLoading={notificationLoading}
              items={notifications}
              onItemClick={onNotificationClick}
              onDeleteItem={onDeleteNotification}
            />
          }
        />

        <AppContainer minMargin>
          <Tabs
            id="home-tabs"
            isFitted
            w="100%"
            variant="soft-rounded"
            colorScheme="blue"
            align="center"
            index={tabIndex}
            onChange={handleTabsChange}
          >
            <TabPanels>
              <TabPanel px="0px" mb={['64px', '128px']}>
                <ExploreTabMockup />
              </TabPanel>
              <TabPanel px="0px" mb={['64px', '128px']}>
                {showSearch ? (
                  <List
                    items={searchLoading ? loadingList : renderSearchResults(searchData?.results)}
                    hasMore={hasMore()}
                    next={searchResultsNextHandler}
                    listHeading="Search results"
                    emptyHeading="No results! Try a different username 🔎"
                  />
                ) : (
                  <List
                    items={
                      !enabled || activityLoading
                        ? loadingList
                        : renderActivityList(activityList?.results)
                    }
                    hasMore={false}
                    next={activityNextHandler}
                    listHeading="Latest activity"
                    emptyHeading="No activity yet. Search for a user to get started! 🚀"
                  />
                )}
              </TabPanel>
              <TabPanel px="0px">
                <AccountTab
                  isEnabled={enabled}
                  isAccountLoading={accountLoading}
                  isWalletLoading={walletLoading}
                  onLogout={logoutHandler}
                  walletBalance={balance}
                  walletAddress={wallet?.walletAddress}
                />
              </TabPanel>
            </TabPanels>

            <TabList
              bg="gray.50"
              borderWidth="1px"
              borderTopRadius="lg"
              borderBottomRadius={['0', 'lg']}
              p="8px"
              pos="fixed"
              bottom={['0px', '32px']}
              left={['0px', 'auto']}
              maxW="544px"
              w="100%"
            >
              <Tab borderRadius="lg">Explore</Tab>
              <Tab borderRadius="lg">Pay</Tab>
              <Tab borderRadius="lg">Account</Tab>
            </TabList>
          </Tabs>
        </AppContainer>
      </PageContainer>
    </>
  );
}
