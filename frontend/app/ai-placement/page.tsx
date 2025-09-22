'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, Search } from 'lucide-react';

interface Job {
  title: string;
  company_name: string;
  location: string;
  description: string;
  url: string;
  extensions: string[];
  apply_links: { title: string; link: string }[];
}

export default function AiPlacementPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [city, setCity] = useState('');
  const [packageAmount, setPackageAmount] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setResumeFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!resumeFile) {
      toast({
        title: 'Error',
        description: 'Please upload your resume.',
        variant: 'destructive',
      });
      return;
    }
    if (!city) {
        toast({
            title: 'Error',
            description: 'Please enter a city.',
            variant: 'destructive',
        });
        return;
    }

    setIsLoading(true);
    setJobs([]);
    setSearchQuery('');

    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('city', city);
    formData.append('package', packageAmount);

    try {
      const response = await fetch('http://localhost:5000/api/job-search', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search for jobs.');
      }
      
      setJobs(data.jobs || []);
      setSearchQuery(data.query);

      if (!data.jobs || data.jobs.length === 0) {
        toast({
            title: 'No jobs found',
            description: 'Your search did not return any results. Try a different city.',
        });
      } else {
        toast({
            title: 'Success!',
            description: `Found ${data.jobs.length} jobs for you.`,
        });
      }

    } catch (error: any) {
      toast({
        title: 'An error occurred',
        description: error.message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">AI-Powered Job Search</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Upload your resume, tell us where you want to work, and let our AI find the perfect job for you.
        </p>
      </header>
      
      <Card className="max-w-2xl mx-auto mb-10 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="w-6 h-6" /> Find Your Next Job</CardTitle>
          <CardDescription>Provide your details below to start the search.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="resume">Resume Upload</Label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="resume" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF, DOC, DOCX, or TXT (MAX. 16MB)</p>
                    </div>
                    <Input id="resume" type="file" className="hidden" onChange={handleFileChange} required accept=".pdf,.doc,.docx,.txt" />
                </label>
              </div>
              {resumeFile && <p className="text-sm text-center text-gray-600 mt-2">Selected: {resumeFile.name}</p>}
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" type="text" placeholder="e.g., London" value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="package">Desired Package (Optional)</Label>
              <Input id="package" type="text" placeholder="e.g., £50,000 per annum" value={packageAmount} onChange={(e) => setPackageAmount(e.target.value)} />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...</> : 'Find Jobs'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {searchQuery && (
        <div className="text-center my-6">
            <p className="text-sm text-muted-foreground">AI-generated search query: <code className="bg-gray-200 text-gray-800 px-2 py-1 rounded">{searchQuery}</code></p>
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {jobs.map((job, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader>
              <CardTitle>{job.title}</CardTitle>
              <CardDescription>{job.company_name} - {job.location}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-4">{job.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {job.extensions?.map((ext, i) => (
                  <span key={i} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{ext}</span>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
                <p className="font-semibold text-sm">Application Links:</p>
                <div className="flex flex-wrap gap-2">
                    {job.apply_links?.map((link, i) => (
                        <Button key={i} variant="outline" size="sm" asChild>
                            <a href={link.link} target="_blank" rel="noopener noreferrer">{link.title}</a>
                        </Button>
                    ))}
                    <Button variant="default" size="sm" asChild>
                        <a href={job.url} target="_blank" rel="noopener noreferrer">View Original Post</a>
                    </Button>
                </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 