import {
    addDoc,
    collection,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    Unsubscribe,
    where,
} from 'firebase/firestore';
import { db } from '../../config';

export interface TestimonialFormData {
  name: string;
  about: string;
  review: string;
  rating: number;
  imageUri?: string | null;
}

export interface TestimonialData {
  id?: string;
  name: string;
  about: string;
  review: string;
  rating: number;
  imageUrl?: string;
  imagePublicId?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

class TestimonialService {
  private collectionName = 'testimonials';
  private cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  private uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  /**
   * Upload image to Cloudinary (FORCED testimonials folder)
   */
  private async uploadToCloudinary(
    imageUri: string
  ): Promise<{ secure_url: string; public_id: string } | null> {
    if (!this.cloudName || !this.uploadPreset) {
      console.warn('Cloudinary credentials missing');
      return null;
    }

    try {
      if (!imageUri) {
        console.warn('Invalid image URI');
        return null;
      }

      const fileName = imageUri.split('/').pop() || 'image.jpg';

      // sanitize filename
      const cleanName = fileName
        .split('.')[0]
        .replace(/[^a-zA-Z0-9]/g, '_');

      const timestamp = Date.now();

      const formData = new FormData();

      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: fileName,
      } as any);

      formData.append('upload_preset', this.uploadPreset);

      // 🔥 FORCE folder using public_id
      formData.append(
        'public_id',
        `testimonials/${timestamp}_${cleanName}`
      );

      // optional but good practice
      formData.append('folder', 'testimonials');

      console.log('Uploading to Cloudinary...');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.text();
        console.error('Cloudinary error:', err);
        return null;
      }

      const data = await response.json();

      console.log('Uploaded:', data.public_id);

      return {
        secure_url: data.secure_url,
        public_id: data.public_id,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return null;
    }
  }

  /**
   * Submit testimonial
   */
  async submitTestimonial(
    data: TestimonialFormData
  ): Promise<TestimonialData> {
    try {
      let imageData = null;

      if (data.imageUri) {
        console.log('Uploading image...');
        imageData = await this.uploadToCloudinary(data.imageUri);
      }

      const testimonialData: Omit<TestimonialData, 'id'> = {
        name: data.name.trim(),
        about: data.about.trim(),
        review: data.review.trim(),
        rating: data.rating,
        status: 'approved',
        createdAt: serverTimestamp() as Timestamp,
        ...(imageData && {
          imageUrl: imageData.secure_url,
          imagePublicId: imageData.public_id,
        }),
      };

      const docRef = await addDoc(
        collection(db, this.collectionName),
        testimonialData
      );

      console.log('Saved testimonial:', docRef.id);

      return {
        id: docRef.id,
        ...testimonialData,
      };
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      throw error;
    }
  }

  /**
   * Get testimonials
   */
  async getApprovedTestimonials(): Promise<TestimonialData[]> {
    const q = query(
      collection(db, this.collectionName),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as TestimonialData)
    );
  }

  /**
   * Real-time subscription
   */
  subscribeToTestimonials(
    callback: (testimonials: TestimonialData[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, this.collectionName),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as TestimonialData)
      );
      callback(data);
    });
  }

  /**
   * Validation
   */
  validateTestimonialData(data: TestimonialFormData): string | null {
    if (!data.name.trim()) return 'Name is required';
    if (!data.about.trim()) return 'Role is required';
    if (!data.review.trim()) return 'Review is required';
    if (data.review.trim().length < 10)
      return 'Review must be at least 10 characters long';
    if (data.rating < 1 || data.rating > 5)
      return 'Rating must be between 1 and 5';

    return null;
  }
}

export const testimonialService = new TestimonialService();