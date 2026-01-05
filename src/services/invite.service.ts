/**
 * Invite Service - Handles group invitations via Firebase
 */

import firestore from '@react-native-firebase/firestore';
import { authService } from './auth.service';
import { generateUUID } from '@/utils/uuid';

export interface GroupInvite {
  id: string;
  groupId: string;
  groupName: string;
  invitedBy: string; // User ID of inviter
  invitedByEmail: string;
  invitedByName: string;
  inviteeEmail: string;
  inviteeUserId?: string; // Set when user accepts
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  expiresAt: string;
}

class InviteService {
  private getUserId(): string {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.id;
  }

  /**
   * Get invites collection reference
   */
  private getInvitesRef() {
    return firestore().collection('invites');
  }

  /**
   * Create an invitation
   */
  async createInvite(
    groupId: string,
    groupName: string,
    inviteeEmail: string,
  ): Promise<GroupInvite> {
    const userId = this.getUserId();
    const user = authService.getCurrentUser();
    if (!user || !user.email) {
      throw new Error('User email not available');
    }

    const id = generateUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite: GroupInvite = {
      id,
      groupId,
      groupName,
      invitedBy: userId,
      invitedByEmail: user.email,
      invitedByName: user.name || user.email,
      inviteeEmail: inviteeEmail.toLowerCase().trim(),
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await this.getInvitesRef().doc(id).set({
      ...invite,
      syncedAt: firestore.FieldValue.serverTimestamp(),
    });

    return invite;
  }

  /**
   * Get pending invites for a user
   */
  async getPendingInvites(email: string): Promise<GroupInvite[]> {
    const snapshot = await this.getInvitesRef()
      .where('inviteeEmail', '==', email.toLowerCase().trim())
      .where('status', '==', 'pending')
      .where('expiresAt', '>', new Date().toISOString())
      .orderBy('expiresAt')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        groupId: data.groupId,
        groupName: data.groupName,
        invitedBy: data.invitedBy,
        invitedByEmail: data.invitedByEmail,
        invitedByName: data.invitedByName,
        inviteeEmail: data.inviteeEmail,
        inviteeUserId: data.inviteeUserId,
        status: data.status,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
      } as GroupInvite;
    });
  }

  /**
   * Accept an invitation
   */
  async acceptInvite(inviteId: string): Promise<void> {
    const userId = this.getUserId();
    await this.getInvitesRef().doc(inviteId).update({
      status: 'accepted',
      inviteeUserId: userId,
      acceptedAt: firestore.FieldValue.serverTimestamp(),
    });
  }

  /**
   * Decline an invitation
   */
  async declineInvite(inviteId: string): Promise<void> {
    await this.getInvitesRef().doc(inviteId).update({
      status: 'declined',
      declinedAt: firestore.FieldValue.serverTimestamp(),
    });
  }

  /**
   * Subscribe to invites for a user (real-time)
   */
  subscribeToInvites(
    email: string,
    callback: (invites: GroupInvite[]) => void,
  ): () => void {
    return this.getInvitesRef()
      .where('inviteeEmail', '==', email.toLowerCase().trim())
      .where('status', '==', 'pending')
      .where('expiresAt', '>', new Date().toISOString())
      .orderBy('expiresAt')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const invites = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            groupId: data.groupId,
            groupName: data.groupName,
            invitedBy: data.invitedBy,
            invitedByEmail: data.invitedByEmail,
            invitedByName: data.invitedByName,
            inviteeEmail: data.inviteeEmail,
            inviteeUserId: data.inviteeUserId,
            status: data.status,
            createdAt: data.createdAt,
            expiresAt: data.expiresAt,
          } as GroupInvite;
        });
        callback(invites);
      });
  }
}

export const inviteService = new InviteService();

