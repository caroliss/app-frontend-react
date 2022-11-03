import { call, fork, put, select } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { SagaIterator } from 'redux-saga';

import { appLanguageStateSelector } from 'src/selectors/appLanguageStateSelector';
import { appListsActions } from 'src/shared/resources/options/appListsSlice';
import { getAppListLookupKey, getAppListLookupKeys } from 'src/utils/applist';
import { getAppListsUrl } from 'src/utils/appUrlHelper';
import {
  getKeyIndex,
  getKeyWithoutIndex,
  getKeyWithoutIndexIndicators,
  replaceIndexIndicatorsWithIndexes,
} from 'src/utils/databindings';
import { selectNotNull } from 'src/utils/sagas';
import type { IFormData } from 'src/features/form/data';
import type { IUpdateFormDataFulfilled } from 'src/features/form/data/formDataTypes';
import type { ILayoutCompList, ILayouts } from 'src/features/form/layout';
import type {
  IAppList,
  IAppLists,
  IAppListsMetaData,
  IFetchSpecificAppListSaga,
  IRepeatingGroups,
  IRuntimeState,
} from 'src/types';

import { get } from 'altinn-shared/utils';

export const formLayoutSelector = (state: IRuntimeState): ILayouts =>
  state.formLayout?.layouts;
export const formDataSelector = (state: IRuntimeState) =>
  state.formData.formData;
export const appListsSelector = (state: IRuntimeState): IAppLists =>
  state.appListState.appLists;
export const appListsWithIndexIndicatorsSelector = (state: IRuntimeState) =>
  state.appListState.appListsWithIndexIndicator;
export const instanceIdSelector = (state: IRuntimeState): string =>
  state.instanceData.instance?.id;
export const repeatingGroupsSelector = (state: IRuntimeState) =>
  state.formLayout?.uiConfig.repeatingGroups;

export function* fetchAppListsSaga(): SagaIterator {
  const layouts: ILayouts = yield selectNotNull(formLayoutSelector);
  const repeatingGroups: IRepeatingGroups = yield selectNotNull(
    repeatingGroupsSelector,
  );
  const fetchedAppLists: string[] = [];
  const appListsWithIndexIndicators = [];
  for (const layoutId of Object.keys(layouts)) {
    for (const element of layouts[layoutId]) {
      const { appListId, mapping, secure } = element as ILayoutCompList;
      console.log(`Her er id:${appListId}`);
      const { keys, keyWithIndexIndicator } = getAppListLookupKeys({
        id: appListId,
        mapping,
        secure,
        repeatingGroups,
      });
      if (keyWithIndexIndicator) {
        appListsWithIndexIndicators.push(keyWithIndexIndicator);
      }

      if (!keys?.length) {
        continue;
      }

      for (const appListsObject of keys) {
        const { id, mapping, secure } = appListsObject;
        const lookupKey = getAppListLookupKey({ id, mapping });
        if (appListId && !fetchedAppLists.includes(lookupKey)) {
          console.log('Inne i fetchAppListSaga inne i for løkke');

          yield fork(fetchSpecificAppListSaga, {
            appListId,
            dataMapping: mapping,
            secure,
          });
          fetchedAppLists.push(lookupKey);
        }
      }
    }
  }
  yield put(
    appListsActions.setAppListsWithIndexIndicators({
      appListsWithIndexIndicators,
    }),
  );
}

export function* fetchSpecificAppListSaga({
  appListId,
  dataMapping,
  secure,
}: IFetchSpecificAppListSaga): SagaIterator {
  console.log('fetchSpecificOptionSaga');
  const key = getAppListLookupKey({ id: appListId, mapping: dataMapping });
  const instanceId = yield select(instanceIdSelector);
  try {
    const metaData: IAppListsMetaData = {
      id: appListId,
      mapping: dataMapping,
      secure,
    };
    yield put(appListsActions.fetching({ key, metaData }));
    const formData: IFormData = yield select(formDataSelector);
    const language = yield select(appLanguageStateSelector);

    const url = getAppListsUrl({
      appListId,
      formData,
      language,
      dataMapping,
      secure,
      instanceId,
    });

    const appLists: IAppList = yield call(get, url);
    const AppListsWithoutMetaData = appLists.listItems;
    yield put(
      appListsActions.fetchFulfilled({
        key,
        appLists: AppListsWithoutMetaData,
      }),
    );
  } catch (error) {
    yield put(appListsActions.fetchRejected({ key: key, error }));
  }
}

export function* checkIfAppListsShouldRefetchSaga({
  payload: { field },
}: PayloadAction<IUpdateFormDataFulfilled>): SagaIterator {
  const appLists: IAppLists = yield select(appListsSelector);
  const appListsWithIndexIndicators = yield select(
    appListsWithIndexIndicatorsSelector,
  );
  let foundInExistingAppLists = false;
  for (const appListKey of Object.keys(appLists)) {
    const dataMapping = appLists[appListKey].mapping;
    const appListId = appLists[appListKey].id;
    const secure = appLists[appListKey].secure;
    if (dataMapping && Object.keys(dataMapping).includes(field)) {
      foundInExistingAppLists = true;
      yield fork(fetchSpecificAppListSaga, {
        appListId,
        dataMapping,
        secure,
      });
    }
  }

  if (foundInExistingAppLists) {
    return;
  }

  for (const appLists of appListsWithIndexIndicators) {
    const { mapping, id, secure } = appLists;
    if (
      mapping &&
      Object.keys(mapping)
        .map((key) => getKeyWithoutIndexIndicators(key))
        .includes(getKeyWithoutIndex(field))
    ) {
      const keys = getKeyIndex(field);
      const newDataMapping = {};

      for (const key of Object.keys(mapping)) {
        newDataMapping[replaceIndexIndicatorsWithIndexes(key, keys)] =
          mapping[key];
      }
      yield fork(fetchSpecificAppListSaga, {
        appListId: id,
        dataMapping: newDataMapping,
        secure,
      });
    }
  }
}