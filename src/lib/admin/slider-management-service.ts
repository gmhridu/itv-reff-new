import { db } from "@/lib/db";
import {
  SliderImage,
  SliderImageUploadData,
  SliderImageUpdateData,
  SliderImageFilters,
  PaginatedSliderImages,
  PaginationParams,
} from "@/types/admin";

export class SliderManagementService {
  /**
   * Get all slider images with pagination and filtering
   */
  async getSliderImages(
    filters: SliderImageFilters = {},
    pagination: PaginationParams = { page: 1, limit: 10 },
  ): Promise<PaginatedSliderImages> {
    try {
      const { page, limit, sortBy = "order", sortOrder = "asc" } = pagination;
      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {};

      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }

      if (filters.searchTerm) {
        whereClause.OR = [
          {
            altText: {
              contains: filters.searchTerm,
              mode: "insensitive",
            },
          },
        ];
      }

      // Get total count
      const totalCount = await db.sliderImage.count({
        where: whereClause,
      });

      // Get paginated results
      const sliderImages = await db.sliderImage.findMany({
        where: whereClause,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: offset,
        take: limit,
      });

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        sliderImages,
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    } catch (error) {
      console.error("Error fetching slider images:", error);
      throw new Error("Failed to fetch slider images");
    }
  }

  /**
   * Get all active slider images ordered by order field
   */
  async getActiveSliderImages(): Promise<SliderImage[]> {
    try {
      return await db.sliderImage.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          order: "asc",
        },
      });
    } catch (error) {
      console.error("Error fetching active slider images:", error);
      throw new Error("Failed to fetch active slider images");
    }
  }

  /**
   * Get slider image by ID
   */
  async getSliderImageById(id: string): Promise<SliderImage | null> {
    try {
      return await db.sliderImage.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error("Error fetching slider image:", error);
      throw new Error("Failed to fetch slider image");
    }
  }

  /**
   * Create new slider image
   */
  async createSliderImage(data: SliderImageUploadData): Promise<SliderImage> {
    try {
      // If no order is specified, get the next order number
      if (data.order === undefined) {
        const lastSlider = await db.sliderImage.findFirst({
          orderBy: { order: "desc" },
        });
        data.order = (lastSlider?.order || 0) + 1;
      }

      return await db.sliderImage.create({
        data: {
          url: data.url,
          altText: data.altText || null,
          order: data.order,
          isActive: data.isActive ?? true,
        },
      });
    } catch (error) {
      console.error("Error creating slider image:", error);
      throw new Error("Failed to create slider image");
    }
  }

  /**
   * Create multiple slider images
   */
  async createMultipleSliderImages(
    dataArray: SliderImageUploadData[],
  ): Promise<SliderImage[]> {
    try {
      // Get the next order number for the first image
      const lastSlider = await db.sliderImage.findFirst({
        orderBy: { order: "desc" },
      });
      let nextOrder = (lastSlider?.order || 0) + 1;

      // Prepare data with sequential order numbers
      const preparedData = dataArray.map((data, index) => ({
        url: data.url,
        altText: data.altText || null,
        order: data.order ?? nextOrder + index,
        isActive: data.isActive ?? true,
      }));

      // Create all images in a transaction
      const results = await db.$transaction(
        preparedData.map((data) => db.sliderImage.create({ data })),
      );

      return results;
    } catch (error) {
      console.error("Error creating multiple slider images:", error);
      throw new Error("Failed to create multiple slider images");
    }
  }

  /**
   * Update slider image
   */
  async updateSliderImage(
    id: string,
    data: SliderImageUpdateData,
  ): Promise<SliderImage> {
    try {
      // Check if slider image exists
      const existingSlider = await this.getSliderImageById(id);
      if (!existingSlider) {
        throw new Error("Slider image not found");
      }

      return await db.sliderImage.update({
        where: { id },
        data: {
          ...(data.url && { url: data.url }),
          ...(data.altText !== undefined && { altText: data.altText }),
          ...(data.order !== undefined && { order: data.order }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });
    } catch (error) {
      console.error("Error updating slider image:", error);
      throw new Error("Failed to update slider image");
    }
  }

  /**
   * Update multiple slider images order
   */
  async updateSliderImagesOrder(
    orderUpdates: { id: string; order: number }[],
  ): Promise<void> {
    try {
      await db.$transaction(
        orderUpdates.map((update) =>
          db.sliderImage.update({
            where: { id: update.id },
            data: { order: update.order },
          }),
        ),
      );
    } catch (error) {
      console.error("Error updating slider images order:", error);
      throw new Error("Failed to update slider images order");
    }
  }

  /**
   * Delete slider image
   */
  async deleteSliderImage(id: string): Promise<void> {
    try {
      // Check if slider image exists
      const existingSlider = await this.getSliderImageById(id);
      if (!existingSlider) {
        throw new Error("Slider image not found");
      }

      await db.sliderImage.delete({
        where: { id },
      });

      // Reorder remaining images to fill gaps
      await this.reorderSliderImages();
    } catch (error) {
      console.error("Error deleting slider image:", error);
      throw new Error("Failed to delete slider image");
    }
  }

  /**
   * Delete multiple slider images
   */
  async deleteMultipleSliderImages(ids: string[]): Promise<void> {
    try {
      await db.sliderImage.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });

      // Reorder remaining images to fill gaps
      await this.reorderSliderImages();
    } catch (error) {
      console.error("Error deleting multiple slider images:", error);
      throw new Error("Failed to delete multiple slider images");
    }
  }

  /**
   * Toggle slider image active status
   */
  async toggleSliderImageStatus(id: string): Promise<SliderImage> {
    try {
      const existingSlider = await this.getSliderImageById(id);
      if (!existingSlider) {
        throw new Error("Slider image not found");
      }

      return await db.sliderImage.update({
        where: { id },
        data: {
          isActive: !existingSlider.isActive,
        },
      });
    } catch (error) {
      console.error("Error toggling slider image status:", error);
      throw new Error("Failed to toggle slider image status");
    }
  }

  /**
   * Reorder slider images to eliminate gaps in order sequence
   */
  private async reorderSliderImages(): Promise<void> {
    try {
      const allSliders = await db.sliderImage.findMany({
        orderBy: { order: "asc" },
      });

      // Update orders to be sequential starting from 1
      await db.$transaction(
        allSliders.map((slider, index) =>
          db.sliderImage.update({
            where: { id: slider.id },
            data: { order: index + 1 },
          }),
        ),
      );
    } catch (error) {
      console.error("Error reordering slider images:", error);
      throw new Error("Failed to reorder slider images");
    }
  }

  /**
   * Get slider images statistics
   */
  async getSliderImagesStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    try {
      const [total, active] = await Promise.all([
        db.sliderImage.count(),
        db.sliderImage.count({
          where: { isActive: true },
        }),
      ]);

      return {
        total,
        active,
        inactive: total - active,
      };
    } catch (error) {
      console.error("Error fetching slider images stats:", error);
      throw new Error("Failed to fetch slider images statistics");
    }
  }
}

// Export singleton instance
export const sliderManagementService = new SliderManagementService();
