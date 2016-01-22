import {
  fetchHNItems,
  fetchHNItemById,
  gitHubUrlParser,
  fetchGitHubRepoLangs,
  fetchGitHubRepoInfo,
  fetchGitHubRepoReadme,
} from '../apis';

import {
  typeToActionMap,
} from '../constants';

const idFn = (x) => x;

const asyncGetSingleRepoInfo = async (slugObj, mergeObj) => {
  // slugObj === { by, name }
  const repoInfo = await fetchGitHubRepoInfo(slugObj);
  return repoInfo.notOk ? false : {
    ...mergeObj,
    ...repoInfo,
  };
};

const asyncGetSingleRepoLangs = async (slugObj, mergeObj) => {
  const langs = await fetchGitHubRepoLangs(slugObj);
  return {
    ...mergeObj,
    langs: langs.notOk ? false : langs,
  };
};

const asyncGetSingleRepoReadme = async (slugObj, mergeObj) => {
  const readme = await fetchGitHubRepoReadme(slugObj);
  // readme is kinda special
  // instead of returning false we should mark them as not having a readme
  return {
    ...mergeObj,
    readme: readme.notOk ? false : readme,
  };
};

const asyncGetRepoInfo = async (type) => {
  const topStoryIds = await fetchHNItems(type); // [ 9127232, 9128437, ... ]
  const rawHNItems = await Promise.all(topStoryIds.map((id) => fetchHNItemById('item', id)));
  const rawItemCount = rawHNItems.length;

  const possibleGitHubItems = rawHNItems
    .filter((item) => item && item.url) // has a url
    .map((item) => ({
      ...item,
      github: gitHubUrlParser(item.url),
    }))
    .filter((obj) => obj.github); // has a url that links to a github repo

  const repoData = (await Promise.all(
    possibleGitHubItems.map((item) => asyncGetSingleRepoInfo(item.github, item))
  )).filter(idFn); // remove falsy ones

  return {
    repoData,
    rawItemCount,
  };
};

export const loadAllForType = (type) => async (dispatch) => {
  const { repoData, rawItemCount } = await asyncGetRepoInfo(type);
  dispatch({
    type: typeToActionMap[type],
    payload: {
      repoData,
      rawItemCount,
    },
  });

  const langs = await Promise.all(
    repoData.map(({ github, id }) => asyncGetSingleRepoLangs(github, { id })),
  );

  dispatch({
    type: typeToActionMap[type] + '_LANGS', // @TODO this doesn't feel right
    payload: langs,
  });

  const readmes = (await Promise.all(
    repoData.map(({ github, id }) => asyncGetSingleRepoReadme(github, { id })),
  )); // don't filter here. instead, let the reducer mark them as false

  dispatch({
    type: typeToActionMap[type] + '_READMES', // @TODO this doesn't feel right
    payload: readmes,
  });
};
