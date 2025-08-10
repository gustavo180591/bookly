<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { redirect } from '@sveltejs/kit';

  // Redirect to admin if already logged in
  $: if ($page.data.session) {
    throw redirect(302, '/admin');
  }

  export let form;
  
  // Get redirectTo from URL
  $: redirectTo = $page.url.searchParams.get('redirectTo') || '/admin';
  
  // Focus password field on mount
  let passwordInput: HTMLInputElement;
  onMount(() => {
    if (passwordInput) {
      passwordInput.focus();
    }
  });
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Acceso al Panel de Administración
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Ingrese la contraseña para continuar
      </p>
    </div>
    
    {#if form?.error}
      <div class="rounded-md bg-red-50 p-4 mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-red-800">{form.error}</p>
          </div>
        </div>
      </div>
    {/if}
    
    <form class="mt-8 space-y-6" method="POST" use:enhance>
      <input type="hidden" name="redirectTo" value={redirectTo} />
      
      <div class="rounded-md shadow-sm -space-y-px">
        <div>
          <label for="password" class="sr-only">Contraseña</label>
          <input
            bind:this={passwordInput}
            id="password"
            name="password"
            type="password"
            required
            class="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            placeholder="Contraseña de administrador"
            autocomplete="current-password"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
        >
          <span class="absolute left-0 inset-y-0 flex items-center pl-3">
            <svg class="h-5 w-5 text-indigo-400 group-hover:text-indigo-300 transition-colors duration-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
            </svg>
          </span>
          Iniciar sesión
        </button>
      </div>
    </form>
    
    <div class="text-center text-sm text-gray-500">
      <p>¿Problemas para acceder? Contacta al soporte.</p>
    </div>
  </div>
</div>
