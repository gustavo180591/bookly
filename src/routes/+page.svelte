<script lang="ts">
  import { enhance } from '$app/forms';
  import { toast } from 'svelte-sonner';
  
  // Define form data type
  interface FormData {
    success?: boolean;
    error?: string;
    message?: string;
    data?: {
      name: string;
      email: string;
      message: string;
    };
    errors?: {
      fieldErrors: {
        [key: string]: string[];
      };
    };
  }
  
  let form: FormData = {};
  
  // Handle form state changes
  $: if (form) {
    if (form.success) {
      toast.success(form.message || 'Message sent successfully!');
    } else if (form.error) {
      toast.error(form.error);
    }
  }
</script>

<div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Contact Us</h1>
      <p class="mt-2 text-gray-600">We'll get back to you as soon as possible</p>
    </div>
    
    <div class="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
      {#if form?.success}
        <div class="rounded-md bg-green-50 p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-green-800">
                {form.message || 'Thank you for your message! We will get back to you soon.'}
              </p>
            </div>
          </div>
        </div>
      {:else}
        <form 
          method="POST" 
          class="space-y-6" 
          on:submit|preventDefault={async (e) => {
            const htmlForm = e.currentTarget as HTMLFormElement;
            const formData = new FormData(htmlForm);
            const name = formData.get('name')?.toString() || '';
            const email = formData.get('email')?.toString() || '';
            const message = formData.get('message')?.toString() || '';
            
            // Simple client-side validation
            if (name.length < 2) {
              toast.error('Name must be at least 2 characters');
              return;
            }
            
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              toast.error('Please enter a valid email address');
              return;
            }
            
            if (message.length < 10) {
              toast.error('Message must be at least 10 characters');
              return;
            }
            
            // Show loading state
            const submitButton = htmlForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;
            const originalHTML = submitButton ? submitButton.innerHTML : '';
            
            if (submitButton) {
              submitButton.disabled = true;
              submitButton.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              `;
            }
            
            try {
              const response = await fetch(htmlForm.action, {
                method: 'POST',
                body: formData
              });
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const result = await response.json();
              
              if (result.type === 'success') {
                // Reset form on success
                htmlForm.reset();
                form = { success: true, message: result.message };
                toast.success('Message sent successfully!');
              } else {
                throw new Error(result.error || 'Failed to send message');
              }
            } catch (error) {
              console.error('Error submitting form:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to send message. Please try again.';
              toast.error(errorMessage);
            } finally {
              if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalHTML;
              }
            }
          }}>
          {#if form?.errors?.fieldErrors}
            <div class="rounded-md bg-red-50 p-4 mb-6">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">
                    There were errors with your submission
                  </h3>
                  <div class="mt-2 text-sm text-red-700">
                    <ul class="list-disc pl-5 space-y-1">
                      {#each Object.entries(form.errors.fieldErrors) as [field, errors]}
                        {#each errors as error}
                          <li>{field}: {error}</li>
                        {/each}
                      {/each}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          {/if}
          
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
            <div class="mt-1">
              <input 
                id="name" 
                name="name" 
                type="text" 
                required 
                value={form?.data?.name || ''}
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                class:border-red-300={form?.errors?.fieldErrors?.name}
              />
              {#if form?.errors?.fieldErrors?.name}
                <p class="mt-1 text-sm text-red-600">{form.errors.fieldErrors.name[0]}</p>
              {/if}
            </div>
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <div class="mt-1">
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                value={form?.data?.email || ''}
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                class:border-red-300={form?.errors?.fieldErrors?.email}
              />
              {#if form?.errors?.fieldErrors?.email}
                <p class="mt-1 text-sm text-red-600">{form.errors.fieldErrors.email[0]}</p>
              {/if}
            </div>
          </div>

          <div>
            <label for="message" class="block text-sm font-medium text-gray-700">Message</label>
            <div class="mt-1">
              <textarea 
                id="message" 
                name="message" 
                rows="4" 
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                class:border-red-300={form?.errors?.fieldErrors?.message}
              >{form?.data?.message || ''}</textarea>
              {#if form?.errors?.fieldErrors?.message}
                <p class="mt-1 text-sm text-red-600">{form.errors.fieldErrors.message[0]}</p>
              {/if}
            </div>
          </div>

          <div>
            <button 
              type="submit" 
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Message
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
</div>

<!-- Toast notifications -->
<div class="fixed top-4 right-4 z-50" id="toast-container"></div>
