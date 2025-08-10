<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  export let data;
  
  function handleLogout() {
    // Clear the session cookie
    document.cookie = 'admin_session=; Path=/admin; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    // Redirect to login
    goto('/admin/login');
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Navigation -->
  <nav class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <span class="text-xl font-bold text-gray-800">Bookly Admin</span>
          </div>
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <a 
              href="/admin" 
              class="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              aria-current="page"
            >
              Panel
            </a>
          </div>
        </div>
        <div class="hidden sm:ml-6 sm:flex sm:items-center">
          <button
            on:click={handleLogout}
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  </nav>

  <!-- Page content -->
  <div class="py-10">
    <main>
      <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>
  </div>
</div>
