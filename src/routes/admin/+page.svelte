<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  // Types
  type ContactStatus = 'NEW' | 'REVIEWED' | 'REPLIED';
  
  interface Contact {
    id: string;
    name: string;
    email: string;
    message: string;
    status: ContactStatus;
    createdAt: string;
  }

  interface PageData {
    contacts: Contact[];
    total: number;
    page: number;
    perPage: number;
    hasNext: boolean;
    hasPrev: boolean;
    search?: string;
    status?: string;
    sort: string;
    order: 'asc' | 'desc';
    session?: {
      authenticated: boolean;
    };
  }

  // Component props
  export let data: PageData;
  
  // Local state
  let searchQuery = $page.url.searchParams.get('search') || '';
  let statusFilter = $page.url.searchParams.get('status') || '';
  let selectedContacts: string[] = [];
  let isBulkActionLoading = false;
  
  // Status badge styles
  const statusStyles = {
    NEW: 'bg-blue-100 text-blue-800',
    REVIEWED: 'bg-yellow-100 text-yellow-800',
    REPLIED: 'bg-green-100 text-green-800'
  };

  // Status options for filter
  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'NEW', label: 'Nuevo' },
    { value: 'REVIEWED', label: 'Revisado' },
    { value: 'REPLIED', label: 'Respondido' }
  ];
  
  // Handle search input with debounce
  let searchTimeout: ReturnType<typeof setTimeout>;
  
  $: if (searchQuery !== undefined) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      updateFilters();
    }, 500);
  }
  
  // Handle status filter change
  $: if (statusFilter !== undefined) {
    updateFilters();
  }
  
  // Redirect to login if not authenticated
  onMount(() => {
    if (!data.session?.authenticated) {
      goto('/admin/login');
    }
  });

  // Update URL with new filters
  function updateFilters() {
    const params = new URLSearchParams($page.url.searchParams);
    
    if (searchQuery) {
      params.set('search', searchQuery);
      params.set('page', '1'); // Reset to first page on new search
    } else {
      params.delete('search');
    }
    
    if (statusFilter) {
      params.set('status', statusFilter);
      params.set('page', '1'); // Reset to first page on status change
    } else {
      params.delete('status');
    }
    
    goto(`?${params.toString()}`, { replaceState: true });
  }

  // Handle sort
  function handleSort(column: string) {
    const params = new URLSearchParams($page.url.searchParams);
    const currentSort = params.get('sort');
    const currentOrder = params.get('order') as 'asc' | 'desc' | null;
    
    if (currentSort === column) {
      params.set('order', currentOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sort', column);
      params.set('order', 'asc');
    }
    
    goto(`?${params.toString()}`, { replaceState: true });
  }

  // Get sort indicator
  function getSortIndicator(column: string) {
    if ($page.url.searchParams.get('sort') !== column) return '';
    return $page.url.searchParams.get('order') === 'asc' ? '↑' : '↓';
  }

  // Format date
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Handle bulk status update
  async function updateStatus(newStatus: ContactStatus) {
    if (selectedContacts.length === 0) return;
    
    isBulkActionLoading = true;
    try {
      const response = await fetch('/admin/contacts/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ids: selectedContacts,
          status: newStatus 
        })
      });
      
      if (response.ok) {
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        console.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      isBulkActionLoading = false;
    }
  }

  // Toggle select all contacts
  function toggleSelectAll(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      selectedContacts = data.contacts.map(contact => contact.id);
    } else {
      selectedContacts = [];
    }
  }

  // Toggle single contact selection
  function toggleContact(id: string, event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      selectedContacts = [...selectedContacts, id];
    } else {
      selectedContacts = selectedContacts.filter(contactId => contactId !== id);
    }
  }

  // Check if a contact is selected
  function isSelected(id: string) {
    return selectedContacts.includes(id);
  }

  // Check if all contacts on current page are selected
  $: allSelected = data.contacts.length > 0 && 
                  data.contacts.every(contact => selectedContacts.includes(contact.id));

  // Status badge styles
  const statusStyles = {
    NEW: 'bg-blue-100 text-blue-800',
    REVIEWED: 'bg-yellow-100 text-yellow-800',
    REPLIED: 'bg-green-100 text-green-800'
  };

  // Status options for filter
  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'NEW', label: 'Nuevo' },
    { value: 'REVIEWED', label: 'Revisado' },
    { value: 'REPLIED', label: 'Respondido' }
  ];
  
  // Handle search input with debounce
  let searchTimeout: NodeJS.Timeout;
  
  $: if (searchQuery !== undefined) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      updateFilters();
    }, 500);
  }
  
  // Handle status filter change
  $: if (statusFilter !== undefined) {
    updateFilters();
  }
  
  // Navigate to previous page
  function prevPage() {
    const params = new URLSearchParams($page.url.searchParams);
    const currentPage = parseInt(params.get('page') || '1');
    if (currentPage > 1) {
      params.set('page', (currentPage - 1).toString());
      goto(`?${params.toString()}`);
    }
  }
  
  // Navigate to next page
  function nextPage() {
    const params = new URLSearchParams($page.url.searchParams);
    const currentPage = parseInt(params.get('page') || '1');
    params.set('page', (currentPage + 1).toString());
    goto(`?${params.toString()}`);
  }
  onMount(() => {
    if (data && !data.session) {
      goto('/admin/login', { replaceState: true });
    }
  });

  // Handle page change
  function goToPage(pageNum: number) {
    const params = new URLSearchParams($page.url.search);
    params.set('page', pageNum.toString());
    goto(`?${params.toString()}`, { replaceState: true });
  }

  // Handle status filter change
  function handleStatusChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const status = select.value as ContactStatus | '';
    const params = new URLSearchParams($page.url.search);

    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }

    params.delete('page'); // Reset to first page
    goto(`?${params.toString()}`, { replaceState: true });
  }

  // Handle search
  function handleSearch() {
    const params = new URLSearchParams($page.url.search);
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    params.delete('page'); // Reset to first page
    goto(`?${params.toString()}`, { replaceState: true });
  }

  // Handle sort
  function handleSort(column: string) {
    const params = new URLSearchParams($page.url.search);

    if (data.sort === column) {
      // Toggle order if same column
      params.set('order', data.order === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to asc
      params.set('sort', column);
      params.set('order', 'asc');
    }

    goto(`?${params.toString()}`, { replaceState: true });
  }
  // Types
  type ContactStatus = 'NEW' | 'REVIEWED' | 'REPLIED';
  
  interface Contact {
    id: string;
    name: string;
    email: string;
    message: string;
    status: ContactStatus;
    createdAt: string;
  }

  interface PageData {
    contacts: Contact[];
    total: number;
    page: number;
    perPage: number;
    hasNext: boolean;
    hasPrev: boolean;
    search?: string;
    status?: string;
    sort: string;
    order: 'asc' | 'desc';
    session?: {
      authenticated: boolean;
    };
  }

  // Component props
  export let data: PageData;
  
  // Local state
  let searchQuery = $page.url.searchParams.get('search') || '';
  let statusFilter = $page.url.searchParams.get('status') || '';
  let selectedContacts: string[] = [];
  let isBulkActionLoading = false;

  // Status badge styles
  const statusStyles = {
    NEW: 'bg-blue-100 text-blue-800',
    REVIEWED: 'bg-yellow-100 text-yellow-800',
    REPLIED: 'bg-green-100 text-green-800'
  };

  // Status options for filter
  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'NEW', label: 'Nuevo' },
    { value: 'REVIEWED', label: 'Revisado' },
    { value: 'REPLIED', label: 'Respondido' }
  ];

  // Handle search input with debounce
  let searchTimeout: ReturnType<typeof setTimeout>;
  
  $: if (searchQuery !== undefined) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      updateFilters();
    }, 500);
  }
  
  // Handle status filter change
  $: if (statusFilter !== undefined) {
    updateFilters();
  }
  
  // Update URL with new filters
  function updateFilters() {
    const params = new URLSearchParams($page.url.searchParams);
    
    if (searchQuery) {
      params.set('search', searchQuery);
      params.set('page', '1'); // Reset to first page on new search
    } else {
      params.delete('search');
    }
    
    if (statusFilter) {
      params.set('status', statusFilter);
      params.set('page', '1'); // Reset to first page on status change
    } else {
      params.delete('status');
    }
    
    goto(`?${params.toString()}`, { replaceState: true });
  }

  // Handle sort
  function handleSort(column: string) {
    const params = new URLSearchParams($page.url.searchParams);
    const currentSort = params.get('sort');
    const currentOrder = params.get('order') as 'asc' | 'desc' | null;
    
    if (currentSort === column) {
      params.set('order', currentOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sort', column);
      params.set('order', 'asc');
    }
    
    goto(`?${params.toString()}`, { replaceState: true });
  }

  // Get sort indicator
  function getSortIndicator(column: string) {
    if ($page.url.searchParams.get('sort') !== column) return '';
    return $page.url.searchParams.get('order') === 'asc' ? '↑' : '↓';
  }

  // Format date
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Navigate to previous page
  function prevPage() {
    const params = new URLSearchParams($page.url.searchParams);
    const currentPage = parseInt(params.get('page') || '1');
    if (currentPage > 1) {
      params.set('page', (currentPage - 1).toString());
      goto(`?${params.toString()}`);
    }
  }
  
  // Navigate to next page
  function nextPage() {
    const params = new URLSearchParams($page.url.searchParams);
    const currentPage = parseInt(params.get('page') || '1');
    params.set('page', (currentPage + 1).toString());
    goto(`?${params.toString()}`);
  }

  // Toggle select all contacts
  function toggleSelectAll(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      selectedContacts = data.contacts.map(contact => contact.id);
    } else {
      selectedContacts = [];
    }
  }

  // Toggle single contact selection
  function toggleContact(id: string, event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      selectedContacts = [...selectedContacts, id];
    } else {
      selectedContacts = selectedContacts.filter(contactId => contactId !== id);
    }
  }

  // Check if a contact is selected
  function isSelected(id: string) {
    return selectedContacts.includes(id);
  }

  // Check if all contacts on current page are selected
  $: allSelected = data.contacts.length > 0 && 
                  data.contacts.every(contact => selectedContacts.includes(contact.id));
  
  // Redirect if not authenticated
  onMount(() => {
    if (data && !data.session) {
      goto('/admin/login', { replaceState: true });
    }
  });
</script>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Panel de Administración</h1>
    <div class="text-sm text-gray-500">
      {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    </div>
  </div>

  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="p-6 border-b border-gray-200">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 class="text-xl font-semibold">Contactos Recibidos</h2>
        
        <!-- Export Button -->
        <a 
          href="/admin/contacts/export?{$page.url.searchParams.toString()}" 
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          Exportar CSV
        </a>
      </div>

      <!-- Search and Filters -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search Input -->
        <div class="md:col-span-2">
          <label for="search" class="sr-only">Buscar</label>
          <div class="relative rounded-md shadow-sm">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              name="search"
              class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Buscar por nombre o email..."
              bind:value={searchQuery}
            />
          </div>
        </div>

        <!-- Status Filter -->
        <div>
          <label for="status" class="sr-only">Estado</label>
          <select
            id="status"
            name="status"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            bind:value={statusFilter}
          >
            {#each statusOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>

        <!-- Bulk Actions -->
        <div class="flex items-end">
          <button
            type="button"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedContacts.length === 0 || isBulkActionLoading}
          >
            {#if isBulkActionLoading}
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando...
            {:else}
              <svg class="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              Marcar como revisado
            {/if}
          </button>
        </div>
      </div>

      <!-- Contacts Table -->
      <div class="mt-8 flex flex-col">
        <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table class="min-w-full divide-y divide-gray-300">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="relative w-12 px-6 sm:w-16 sm:px-8">
                      <input
                        type="checkbox"
                        class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
                        bind:checked={allSelected}
                        on:change={toggleSelectAll}
                      />
                    </th>
                    <th 
                      scope="col" 
                      class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 cursor-pointer hover:text-indigo-600"
                      on:click={() => handleSort('name')}
                    >
                      Nombre {getSortIndicator('name')}
                    </th>
                    <th 
                      scope="col" 
                      class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:text-indigo-600"
                      on:click={() => handleSort('email')}
                    >
                      Email {getSortIndicator('email')}
                    </th>
                    <th 
                      scope="col" 
                      class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:text-indigo-600"
                      on:click={() => handleSort('createdAt')}
                    >
                      Fecha {getSortIndicator('createdAt')}
                    </th>
                    <th 
                      scope="col" 
                      class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:text-indigo-600"
                      on:click={() => handleSort('status')}
                    >
                      Estado {getSortIndicator('status')}
                    </th>
                    <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span class="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                  {#if data.contacts.length === 0}
                    <tr>
                      <td colspan="6" class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6 text-center">
                        No se encontraron contactos
                      </td>
                    </tr>
                  {:else}
                    {#each data.contacts as contact (contact.id)}
                      <tr class={isSelected(contact.id) ? 'bg-gray-50' : ''}>
                        <td class="relative w-12 px-6 sm:w-16 sm:px-8">
                          <div class="absolute inset-y-0 left-0 w-0.5 bg-indigo-600"></div>
                          <input
                            type="checkbox"
                            class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
                            checked={isSelected(contact.id)}
                            on:change={(e) => toggleContact(contact.id, e)}
                          />
                        </td>
                        <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {contact.name}
                        </td>
                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <a href={`mailto:${contact.email}`} class="text-indigo-600 hover:text-indigo-900">
                            {contact.email}
                          </a>
                        </td>
                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(contact.createdAt)}
                        </td>
                        <td class="whitespace-nowrap px-3 py-4 text-sm">
                          <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[contact.status]}`}>
                            {statusOptions.find(s => s.value === contact.status)?.label || contact.status}
                          </span>
                        </td>
                        <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            type="button"
                            class="text-indigo-600 hover:text-indigo-900 mr-4"
                            on:click={() => {}}
                          >
                            Ver
                          </button>
                          <button
                            type="button"
                            class="text-red-600 hover:text-red-900"
                            on:click={() => {}}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    {/each}
                  {/if}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="mt-4 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div class="flex flex-1 justify-between sm:hidden">
          <button
            class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={!data.hasPrev}
            on:click={prevPage}
          >
            Anterior
          </button>
          <button
            class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={!data.hasNext}
            on:click={nextPage}
          >
            Siguiente
          </button>
        </div>
        <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Mostrando <span class="font-medium">{(data.page - 1) * data.perPage + 1}</span> a 
              <span class="font-medium">
                {data.page * data.perPage > data.total ? data.total : data.page * data.perPage}
              </span> de <span class="font-medium">{data.total}</span> resultados
            </p>
          </div>
          <div>
            <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                disabled={!data.hasPrev}
                on:click={prevPage}
              >
                <span class="sr-only">Anterior</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                </svg>
              </button>
              <span class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                Página {data.page}
              </span>
              <button
                class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                disabled={!data.hasNext}
                on:click={nextPage}
              >
                <span class="sr-only">Siguiente</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
          placeholder="Buscar por nombre, email o mensaje..."
          class="w-full p-2 border rounded"
          value={searchQuery}
          on:input={(e) => {
            searchQuery = (e.target as HTMLInputElement).value;
            handleSearch();
          }}
        />
      </div>
      <select
        class="p-2 border rounded"
        value={pageData?.data.status || ''}
        on:change={handleStatusChange}
      >
        <option value="">Todos los estados</option>
        <option value="NEW">Nuevo</option>
        <option value="REVIEWED">Revisado</option>
        <option value="REPLIED">Respondido</option>
      </select>

      <button
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        on:click={handleSearch}
      >
        Limpiar
      </button>
    </div>

    <!-- Contacts Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white">
        <thead>
          <tr class="bg-gray-100">
            <th class="py-2 px-4 text-left">
              <a href={`?sort=name&order=${pageData?.data.order === 'asc' ? 'desc' : 'asc'}`}>
                Nombre {#if pageData?.data.sort === 'name'}{pageData?.data.order === 'asc' ? '↑' : '↓'}{/if}
              </a>
            </th>
            <th class="py-2 px-4 text-left">
              <a href={`?sort=email&order=${pageData?.data.order === 'asc' ? 'desc' : 'asc'}`}>
                Email {#if pageData?.data.sort === 'email'}{pageData?.data.order === 'asc' ? '↑' : '↓'}{/if}
              </a>
            </th>
            <th class="py-2 px-4 text-left">Mensaje</th>
            <th class="py-2 px-4 text-left">
              <a href={`?sort=status&order=${pageData?.data.order === 'asc' ? 'desc' : 'asc'}`}>
                Estado {#if pageData?.data.sort === 'status'}{pageData?.data.order === 'asc' ? '↑' : '↓'}{/if}
              </a>
            </th>
            <th class="py-2 px-4 text-left">
              <a href={`?sort=createdAt&order=${pageData?.data.order === 'asc' ? 'desc' : 'asc'}`}>
                Fecha {#if pageData?.data.sort === 'createdAt'}{pageData?.data.order === 'asc' ? '↑' : '↓'}{/if}
              </a>
            </th>
            <th class="py-2 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each pageData?.data.contacts || [] as contact}
            <tr class="border-t">
              <td class="py-2 px-4">{contact.name}</td>
              <td class="py-2 px-4">{contact.email}</td>
              <td class="py-2 px-4 max-w-xs truncate">{contact.message}</td>
              <td class="py-2 px-4">
                <span class="px-2 py-1 text-xs rounded-full {contact.status === 'NEW' ? 'bg-blue-100 text-blue-800' : contact.status === 'REVIEWED' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
                  {contact.status === 'NEW' ? 'Nuevo' : contact.status === 'REVIEWED' ? 'Revisado' : 'Respondido'}
                </span>
              </td>
              <td class="py-2 px-4">{new Date(contact.createdAt).toLocaleString()}</td>
              <td class="py-2 px-4 text-right">
                <a href="/admin/contacts/{contact.id}" class="text-blue-600 hover:underline mr-2">Ver</a>
                <button 
                  type="button" 
                  class="text-red-600 hover:underline bg-transparent border-none p-0 cursor-pointer"
                  on:click={() => {
                    // Handle delete functionality
                    if (confirm('¿Estás seguro de que quieres eliminar este contacto?')) {
                      fetch(`/admin/contacts/${contact.id}`, { method: 'DELETE' })
                        .then(() => window.location.reload())
                        .catch(error => console.error('Error deleting contact:', error));
                    }
                  }}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="mt-6 flex justify-between items-center">
      <div>
        <span class="text-sm text-gray-600">
          Mostrando {pageData?.data.contacts?.length || 0} de {pageData?.data.total || 0} contactos
        </span>
      </div>
      <div class="flex space-x-2">
        <button
          class="px-3 py-1 border rounded {data.page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}"
          disabled={data.page === 1}
          on:click|preventDefault={() => data.page > 1 && goToPage(data.page - 1)}
        >
          Anterior
        </button>
        <button
          class="px-3 py-1 border rounded {!data.hasNext ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}"
          disabled={!data.hasNext}
          on:click|preventDefault={() => data.hasNext && goToPage(data.page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>

    <!-- Export Button -->
    <div class="mt-6">
      <a
        href={`/admin/contacts/export?${pageData?.url.searchParams.toString()}`}
        class="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Exportar a CSV
      </a>
    </div>
  </div>
  
  <!-- Logout Button -->
  <div class="mt-6 text-right">
    <form action="?/logout" method="POST">
      <button type="submit" class="text-red-600 hover:underline">Cerrar sesión</button>
    </form>
  </div>
</div>
