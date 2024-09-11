import singleSpaHtml from 'single-spa-html';
import axios from 'axios';
import store from 'store/store'

let authToken = store.authToken;
store.subscribe(() => {
  authToken = store.authToken;
});

const template = `<div class="diseases"></div>`;

const jsComponent = singleSpaHtml({
  template,
});

jsComponent.originalMount = jsComponent.mount;

jsComponent.mount = function(opts, props) {
  return jsComponent.originalMount(opts, props)
    .then(() => {
      const el = document.querySelector('.diseases');

      // Fetch data from the API
      return axios.get('http://localhost:8080/api/v1/disease', { headers: { Authorization: `Bearer ${authToken}` } })
        .then(response => {
          const array = response.data; // Assume data is an array of diseases
          const html = array.slice(0,5).map((disease, index) => 
            `<div>${disease.code} - ${disease.description}</div>`
          ).join('');
          el.innerHTML = html;
        })
        .catch(error => {
          console.error('Error fetching diseases:', error);
          el.innerHTML = '<div>Error loading diseases data.</div>';
        });
    });
};

export const bootstrap = jsComponent.bootstrap;
export const mount = jsComponent.mount;
export const unmount = jsComponent.unmount;
