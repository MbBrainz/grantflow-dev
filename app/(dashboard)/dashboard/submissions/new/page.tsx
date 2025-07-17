'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Send } from 'lucide-react';
import Link from 'next/link';
import { createSubmission } from '../actions';

export default function NewSubmissionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    executiveSummary: '',
    postGrantPlan: '',
    githubRepoUrl: '',
    totalAmount: '',
    labels: [] as string[],
    milestones: [
      {
        title: '',
        description: '',
        requirements: '',
        amount: '',
        dueDate: '',
      }
    ]
  });

  const projectLabels = [
    'Infrastructure',
    'Developer Tools',
    'DeFi',
    'NFT/Gaming',
    'Education',
    'Research',
    'Community',
    'UX/UI',
    'Security',
    'Parachain',
    'Smart Contracts',
    'Cross-chain'
  ];

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMilestoneChange = (index: number, field: string, value: string) => {
    const updatedMilestones = [...formData.milestones];
    updatedMilestones[index] = {
      ...updatedMilestones[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      milestones: updatedMilestones
    }));
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        {
          title: '',
          description: '',
          requirements: '',
          amount: '',
          dueDate: '',
        }
      ]
    }));
  };

  const removeMilestone = (index: number) => {
    if (formData.milestones.length > 1) {
      const updatedMilestones = formData.milestones.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        milestones: updatedMilestones
      }));
    }
  };

  const toggleLabel = (label: string) => {
    const isSelected = formData.labels.includes(label);
    const newLabels = isSelected
      ? formData.labels.filter(l => l !== label)
      : [...formData.labels, label];
    
    handleInputChange('labels', newLabels);
  };

  const saveDraft = async () => {
    setIsDraft(true);
    try {
      console.log('[new_submission]: Saving draft', formData);
      localStorage.setItem('grant_draft', JSON.stringify(formData));
    } catch (error) {
      console.error('[new_submission]: Error saving draft', error);
    } finally {
      setIsDraft(false);
    }
  };

  const submitProposal = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('[new_submission]: Submitting proposal', formData);
      
      // Create FormData object to match server action expectation
      const submitFormData = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'labels') {
          submitFormData.append(key, JSON.stringify(value));
        } else if (key === 'milestones') {
          submitFormData.append(key, JSON.stringify(value));
        } else {
          submitFormData.append(key, String(value));
        }
      });
      
      // Call server action
      const result = await createSubmission({}, submitFormData);
      
      if (result?.error) {
        setError(result.error);
        return;
      }
      
      // Remove draft from local storage on successful submission
      localStorage.removeItem('grant_draft');
      
      // Server action handles redirect, but just in case:
      // router.push('/dashboard/submissions');
      
    } catch (error) {
      console.error('[new_submission]: Error submitting proposal', error);
      setError('Failed to submit proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('grant_draft');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setFormData(parsedDraft);
      } catch (error) {
        console.error('[new_submission]: Error loading draft', error);
      }
    }
  }, []);

  // Validation
  const isFormValid = formData.title && 
                     formData.description && 
                     formData.executiveSummary && 
                     formData.postGrantPlan && 
                     formData.totalAmount && 
                     formData.labels.length > 0 &&
                     formData.milestones.every(m => m.title && m.description && m.requirements && m.amount);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/submissions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Submissions
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Grant Submission</h1>
          <p className="text-muted-foreground">
            Submit a new grant proposal for review
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Provide basic details about your grant proposal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                placeholder="Enter your project title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short Description *</Label>
              <textarea
                id="description"
                className="w-full min-h-[100px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                placeholder="Brief description of your project (max 500 characters)"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                maxLength={500}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/500 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Funding Amount (USD) *</Label>
              <Input
                id="totalAmount"
                type="number"
                placeholder="Enter total funding amount"
                value={formData.totalAmount}
                onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="githubRepoUrl">GitHub Repository URL</Label>
              <Input
                id="githubRepoUrl"
                type="url"
                placeholder="https://github.com/username/repo"
                value={formData.githubRepoUrl}
                onChange={(e) => handleInputChange('githubRepoUrl', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Link to your project repository (if available)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Project Labels */}
        <Card>
          <CardHeader>
            <CardTitle>Project Category</CardTitle>
            <CardDescription>
              Select categories that best describe your project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {projectLabels.map((label) => (
                <Button
                  key={label}
                  variant={formData.labels.includes(label) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleLabel(label)}
                  type="button"
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Executive Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Executive Summary *</CardTitle>
            <CardDescription>
              Explain what your project will build and how it benefits the ecosystem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full min-h-[200px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
              placeholder="Provide a comprehensive overview of your project, its goals, and expected impact..."
              value={formData.executiveSummary}
              onChange={(e) => handleInputChange('executiveSummary', e.target.value)}
              required
            />
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Milestones *</CardTitle>
            <CardDescription>
              Break down your project into specific milestones with requirements and funding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.milestones.map((milestone, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Milestone {index + 1}</h4>
                  {formData.milestones.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMilestone(index)}
                      type="button"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`milestone-title-${index}`}>Milestone Title *</Label>
                    <Input
                      id={`milestone-title-${index}`}
                      placeholder="e.g., MVP Development"
                      value={milestone.title}
                      onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`milestone-description-${index}`}>Description *</Label>
                    <textarea
                      id={`milestone-description-${index}`}
                      className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                      placeholder="Describe what will be accomplished in this milestone"
                      value={milestone.description}
                      onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`milestone-requirements-${index}`}>Acceptance Criteria *</Label>
                    <textarea
                      id={`milestone-requirements-${index}`}
                      className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                      placeholder="List specific requirements that must be met to complete this milestone"
                      value={milestone.requirements}
                      onChange={(e) => handleMilestoneChange(index, 'requirements', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`milestone-amount-${index}`}>Funding Amount (USD) *</Label>
                      <Input
                        id={`milestone-amount-${index}`}
                        type="number"
                        placeholder="0"
                        value={milestone.amount}
                        onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`milestone-dueDate-${index}`}>Due Date</Label>
                      <Input
                        id={`milestone-dueDate-${index}`}
                        type="date"
                        value={milestone.dueDate}
                        onChange={(e) => handleMilestoneChange(index, 'dueDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addMilestone}
              type="button"
              className="w-full"
            >
              Add Another Milestone
            </Button>
          </CardContent>
        </Card>

        {/* Post-Grant Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Post-Grant Development Plan *</CardTitle>
            <CardDescription>
              Describe how the project will continue after the grant period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full min-h-[150px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
              placeholder="Explain your sustainability plans, ongoing development, community building, or future funding strategies..."
              value={formData.postGrantPlan}
              onChange={(e) => handleInputChange('postGrantPlan', e.target.value)}
              required
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={saveDraft}
            disabled={isDraft}
          >
            <Save className="h-4 w-4 mr-2" />
            {isDraft ? 'Saving...' : 'Save Draft'}
          </Button>

          <Button
            onClick={submitProposal}
            disabled={isSubmitting || !isFormValid}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
          </Button>
        </div>
      </div>
    </div>
  );
} 