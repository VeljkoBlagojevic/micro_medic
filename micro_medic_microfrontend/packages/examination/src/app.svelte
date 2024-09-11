<script>
  import axios from 'axios';
  import store from 'store/store';

  let authToken = store.authToken;
  store.subscribe(() => {
    authToken = store.authToken;
  });

  // Form data that will be submitted
  let formData = {
    anamnesis: '',
    status: ''
  };

  const submitData = () => {
    if (!formData.anamnesis || !formData.status) {
      alert('Please fill out both fields');
      return;
    }

    axios.post('http://localhost:8080/api/v1/examination', formData, { headers: { Authorization: `Bearer ${authToken}` }})
    .then(console.log)
    .catch(console.error);
  };
</script>

<div class="mui-panel">
  <form on:submit|preventDefault={submitData}>
    <div style="text-align: center;">
      <!-- Product Name Field -->
      <div class="mui-textfield">
        <input
          type="text"
          placeholder="Anamnesis"
          bind:value={formData.anamnesis}
          required
        />
      </div>

      <!-- Quantity Field -->
      <div class="mui-textfield">
        <input
          type="text"
          placeholder="Status"
          bind:value={formData.status}
          required
        />
      </div>
    </div>

    <!-- Submit Button -->
    <button
      type="submit"
      class="mui-btn mui-btn--primary"
      style="width: 100%;"
    >
      Submit
    </button>
  </form>
</div>

<style>
  /* Add any necessary styles for your form */
</style>
