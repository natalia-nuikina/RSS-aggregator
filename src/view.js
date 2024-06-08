import onChange from 'on-change';

export default (elements, i18n, state) => {
  // console.log(state);
  const renderValid = (elements, value) => {
    console.log(elements);
    value ? elements.input.classList.remove('is-invalid') : elements.input.classList.add('is-invalid');
  };

  const renderFeedback = (elements, i18n, state) => {
    if (state.form.error) {
      elements.feedback.textContent = (state.form.error[0].includes('URL')) ? i18n.t('feedbacks.errors.invalid') : i18n.t('feedbacks.errors.exists');
      elements.feedback.classList.add('text-danger')
    } else {
      elements.feedback.textContent = i18n.t('feedbacks.valid');
      elements.feedback.style.color = 'green';
      elements.feedback.classList.remove('text-danger')
    }
  }

  const renderStatus = (elements, current) => {
    switch (current) {
      case 'finished':
        renderFeedback(elements, i18n, watchedState);
        elements.input.value = '';
        elements.input.focus();
        break;
    }
  }
  const watchedState = onChange(state, (path, current) => {
    switch (path) {
      case 'form.status':
        renderStatus(elements, current)
        break;
      case 'form.error':
        renderFeedback(elements, i18n, watchedState)
        console.log(path);
        console.log(state.form.error);

        break;
      case 'form.valid':
        renderValid(elements, current)
        break;
      case 'form.field.website':
        // console.log(path);
        break;
      case 'form.watchUrl':
        // console.log(path);
        break;
      default:
        break;
    }
  })
  return watchedState;
};