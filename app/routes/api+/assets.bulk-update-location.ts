import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { BulkLocationUpdateSchema } from "~/components/assets/bulk-location-update-modal";
import { bulkUpdateAssetLocation } from "~/modules/asset/service.server";
import { sendNotification } from "~/utils/emitter/send-notification.server";
import { makeShelfError } from "~/utils/error";
import { assertIsPost, data, error, parseData } from "~/utils/http.server";
import {
  PermissionAction,
  PermissionEntity,
} from "~/utils/permissions/permission.validator.server";
import { requirePermission } from "~/utils/roles.server";

export async function action({ context, request }: ActionFunctionArgs) {
  const authSession = context.getSession();
  const userId = authSession.userId;

  try {
    assertIsPost(request);

    const formData = await request.formData();

    const { organizationId } = await requirePermission({
      userId,
      request,
      entity: PermissionEntity.asset,
      action: PermissionAction.update,
    });

    const { assetIds, newLocationId } = parseData(
      formData,
      BulkLocationUpdateSchema
    );

    await bulkUpdateAssetLocation({
      userId,
      assetIds,
      organizationId,
      newLocationId,
    });

    sendNotification({
      title: "Assets updated",
      message: "Your assets' locations have been successfully updated",
      icon: { name: "success", variant: "success" },
      senderId: authSession.userId,
    });

    return json(data({ success: true }));
  } catch (cause) {
    const reason = makeShelfError(cause, { userId });
    return json(error(reason), { status: reason.status });
  }
}
