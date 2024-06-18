import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import { uniqueId } from 'lodash';
import watch from './view.js';
import resources from './ru.js';
import makeUrl from './helpers.js';
import parser from './parser.js';

export default () => {
  const defaultLanguage = 'ru';
  i18next.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  });

  const elements = {
    title: document.querySelector('h1'),
    subtitle: document.querySelector('.lead'),
    label: document.querySelector('[for="url-input"]'),
    add: document.querySelector('[type="submit"]'),
    example: document.querySelector('.example'),
    fullArticle: document.querySelector('.full-article'),
    buttonClose: document.querySelector('.btn-secondary'),
    form: document.querySelector('form'),
    input: document.querySelector('input'),
    feedback: document.querySelector('.feedback'),
    feeds: document.querySelector('.feeds'),
    posts: document.querySelector('.posts'),
  };

  const state = {
    form: {
      status: 'filling',
      valid: true,
      error: null,
      field: {
        website: '',
      },
      watchUrl: [],
    },
    feeds: [],
    posts: [],
    ulStateOpend: [],
  };

  const schema = yup.object({
    website: yup.string().url().notOneOf(state.form.watchUrl),
  });

  const watchedState = watch(elements, i18next, state);

  const getNewPosts = (feeds) => {
    feeds.forEach((feed) => {
      axios.get(feed.url)
        .then((response) => {
          const document = parser(response.data.contents);
          const postsArr = Array.from(document.querySelectorAll('item'));
          const filterPost = (post) => {
            const timeOfPost = post.querySelector('pubDate').textContent;
            if (timeOfPost > feed.lastUpdate) {
              return true;
            }
            return false;
          }
          const newPosts = postsArr.filter(filterPost);
          newPosts.map((post) => {
            const newPost = {
              id: uniqueId(),
              text: post.querySelector('title').textContent,
              description: post.querySelector('description').textContent,
              link: post.querySelector('link').textContent,
              feedId: feed.id,
            };
            watchedState.posts.push(newPost);
            feed.lastUpdate = post.querySelector('pubDate').textContent;
            return newPost;
          });
          watchedState.form.status = 'finished';
          setTimeout(() => getNewPosts(watchedState.feeds), 5000);
        })
        .catch((err) => {
          watchedState.form.status = 'failed';
          watchedState.form.valid = false;
          watchedState.form.error = (axios.isAxiosError(err)) ? 'networkError' : err.message;
        })
    });
    
  }

  const getFeedAndPosts = (url) => {
    axios.get(makeUrl(url))
    .then(response => {
      const document = parser(response.data.contents);
      const postsArr = Array.from(document.querySelectorAll('item'));
      const feed = { 
        id: uniqueId(),
        text: document.querySelector('channel > title').textContent,
        description: document.querySelector('channel > description').textContent,
        url: makeUrl(url),
        lastUpdate: postsArr[0].querySelector('pubDate').textContent,
      };
      const posts = postsArr.reverse().map((post) => {
        return {
          id: uniqueId(),
          text: post.querySelector('title').textContent,
          description: post.querySelector('description').textContent,
          link: post.querySelector('link').textContent,
          feedId: feed.id,
        };
      });
      watchedState.form.status = 'finished';
      watchedState.feeds.push(feed);
      watchedState.posts = posts;
      getNewPosts(watchedState.feeds);
    })
    .catch((err) => {
      watchedState.form.error = (err.isAxiosError) ? 'networkError' : err.message;
      watchedState.form.valid = false;
      watchedState.form.status = 'failed';
    });
  }

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.form.status = 'sending';
    const formData = new FormData(elements.form);
    const url = formData.get('url');
    watchedState.form.field.website = url;
    schema.validate(state.form.field)
      .then(() => {
        watchedState.form.valid = true;
        watchedState.form.error = null;
        if (state.form.watchUrl.includes(url)) {
          watchedState.form.error = 'duplicate';
          watchedState.form.valid = false;
          watchedState.form.status = 'failed';
        } else {
          getFeedAndPosts(url);
          watchedState.form.watchUrl.push(url);
        }
      })
      .catch((err) => {
        
        watchedState.form.error = err.type;
        watchedState.form.valid = false;
        watchedState.form.status = 'failed';
      })
    watch(elements, i18next, watchedState);
  });
};