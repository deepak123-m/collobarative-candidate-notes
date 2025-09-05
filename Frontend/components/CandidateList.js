import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Mail } from 'lucide-react';
import Link from 'next/link';

export default function CandidateList({ candidates }) {
  if (candidates.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            <Users className="mx-auto h-12 w-12 opacity-50" />
            <p className="mt-4">No candidates yet</p>
            <p className="text-sm">Create your first candidate to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {candidates.map((candidate) => (
        <Card key={candidate.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>
                  <Link 
                    href={`/candidates/${candidate.id}`}
                    className="hover:underline"
                  >
                    {candidate.name}
                  </Link>
                </CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Mail className="mr-2 h-4 w-4" />
                  {candidate.email}
                </CardDescription>
              </div>
              <Link href={`/candidates/${candidate.id}`}>
                <Button variant="outline" size="sm">
                  View Notes
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}