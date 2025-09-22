import json

def search_jobs_api(query: str):
    """
    Mocks a call to a job search API.
    
    Reads job data from api_struct.txt and returns the first 8 results.
    In a real application, this would use the `query` to call an external API
    like Google Jobs Search.
    """
    print(f"Simulating job search for query: {query}")
    try:
        # Assuming the script is run from the root of the `backend` directory 
        # or the path is relative to the workspace root.
        with open('backend/ai-placement/api_struct.txt', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Return the first 8 job results from the mock data.
        return data.get("jobs_results", [])[:8]
    except FileNotFoundError:
        print("Error: api_struct.txt not found. Returning empty list.")
        return []
    except json.JSONDecodeError:
        print("Error: Could not decode JSON from api_struct.txt. Returning empty list.")
        return []
    except Exception as e:
        print(f"An unexpected error occurred in search_jobs_api: {e}")
        return [] 