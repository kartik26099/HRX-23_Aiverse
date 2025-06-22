"use client"

import React from 'react';
import { Button } from '@/components/ui/button';

interface CommunityGuidelinesProps {
  open: boolean;
  onClose: () => void;
}

export const CommunityGuidelines: React.FC<CommunityGuidelinesProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Community Guidelines</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
        </div>
        
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-base mb-2">Be Respectful</h3>
            <p className="text-muted-foreground">
              Treat all community members with respect and kindness. Personal attacks, harassment, 
              or discriminatory language will not be tolerated.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-base mb-2">Stay On Topic</h3>
            <p className="text-muted-foreground">
              Keep discussions relevant to learning, education, and AI. Off-topic posts may be 
              removed to maintain focus.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-base mb-2">Share Constructively</h3>
            <p className="text-muted-foreground">
              Share experiences, ask questions, and provide helpful feedback. Constructive 
              criticism is welcome, but be supportive of others' learning journeys.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-base mb-2">No Spam or Self-Promotion</h3>
            <p className="text-muted-foreground">
              Avoid excessive self-promotion, spam, or commercial content. Focus on sharing 
              knowledge and helping others learn.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-base mb-2">Respect Privacy</h3>
            <p className="text-muted-foreground">
              Don't share personal information about yourself or others. Use the anonymous 
              posting feature when appropriate.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-base mb-2">Report Inappropriate Content</h3>
            <p className="text-muted-foreground">
              If you see content that violates these guidelines, use the report button to 
              bring it to our attention. We review all reports promptly.
            </p>
          </div>
          
          <div className="bg-muted p-3 rounded">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Violation of these guidelines may result in content removal, 
              temporary suspension, or permanent ban from the community. We reserve the right to 
              take appropriate action to maintain a positive learning environment.
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>I Understand</Button>
        </div>
      </div>
    </div>
  );
}; 