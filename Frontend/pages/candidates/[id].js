import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import UserMention from '@/components/UserMention';

export default function CandidateDetail() {
  const [candidate, setCandidate] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const socket = useSocket();
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      fetchCandidate();
      fetchNotes();
      fetchUsers();
    }
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join-candidate', id);

    socket.on('note-added', (data) => {
      if (data.candidateId.toString() === id) {
        setNotes(prev => [...prev, data]);
      }
    });

    socket.on('user-tagged', (data) => {
      if (data.userId === user.id) {
        console.log('You were tagged in a note:', data);
      }
    });

    return () => {
      socket.emit('leave-candidate', id);
      socket.off('note-added');
      socket.off('user-tagged');
    };
  }, [socket, id, user]);

  const fetchCandidate = async () => {
    try {
      const response = await api.get(`/candidates/${id}`);
      setCandidate(response.data);
    } catch (error) {
      console.error('Failed to fetch candidate:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await api.get(`/candidates/${id}/notes`);
      setNotes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const tagRegex = /@(\w+)/g;
      const matches = [...newNote.matchAll(tagRegex)];
      const tags = matches.map(match => {
        const username = match[1];
        const user = users.find(u => u.name.toLowerCase().includes(username.toLowerCase()));
        return user ? user.id : null;
      }).filter(Boolean);

      const response = await api.post(`/candidates/${id}/notes`, {
        message: newNote,
        tags
      });

      if (socket) {
        socket.emit('new-note', {
          ...response.data,
          candidateId: id,
          candidateName: candidate.name,
          userId: user.id
        });
      }

      setNewNote('');
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!candidate) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Candidate not found</h2>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Candidates
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{candidate.name}</CardTitle>
          <CardDescription>{candidate.email}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>
                Collaborative notes for {candidate.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {notes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{note.user_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(note.created_at)}
                      </div>
                    </div>
                    <UserMention text={note.message} users={users} />
                  </div>
                ))}
                {notes.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No notes yet. Be the first to add one!
                  </div>
                )}
              </div>

              <form onSubmit={handleAddNote} className="flex space-x-2">
                <Input
                  placeholder="Add a note... Use @ to mention someone"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <Button type="submit" disabled={!newNote.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                People you can mention in notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center p-2 rounded-md bg-muted">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {user.name.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}