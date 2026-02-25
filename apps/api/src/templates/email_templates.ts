import { escapeHtml, renderMailShell } from "@frameworkx/shared";

type BaseContext = {
  instanceLabel?: string;
  instanceUrl?: string;
};

type ApprovedContext = BaseContext & {
  username: string;
  tempPassword: string;
  loginUrl: string;
};

type RejectedContext = BaseContext & {
  loginUrl?: string;
};

type ResetContext = BaseContext & {
  resetUrl: string;
};

type TrainingContext = BaseContext & {
  runName?: string;
  status?: string;
  detailUrl?: string;
};

type CommentContext = BaseContext & {
  author?: string;
  body?: string;
  imageUrl?: string;
  detailUrl?: string;
};

export function renderApprovedEmail(ctx: ApprovedContext) {
  const body = `
    <div style="font-size:14px;line-height:1.6;">
      Your request was approved. Use the temporary password below to sign in.
    </div>
    <div style="margin-top:12px;padding:12px;border-radius:10px;background:#1d140d;border:1px solid #3a2a1d;">
      <div style="font-weight:700;color:#e0b46b;margin-bottom:6px;">Credentials</div>
      <div><strong>Username:</strong> ${escapeHtml(ctx.username)}</div>
      <div><strong>Temp password:</strong> ${escapeHtml(ctx.tempPassword)}</div>
      <div><strong>Login:</strong> <a href="${escapeHtml(ctx.loginUrl)}" style="color:#e0b46b;">${escapeHtml(
    ctx.loginUrl
  )}</a></div>
    </div>
    <div style="margin-top:12px;color:#bfa98b;">You will be asked to change your password after login.</div>
  `;
  return {
    subject: "FrameWorkX Access Approved",
    text: `Approved. Username: ${ctx.username} | Temp password: ${ctx.tempPassword} | Login: ${ctx.loginUrl}`,
    html: renderMailShell({
      title: "FrameWorkX",
      subtitle: "Access approved",
      bodyHtml: body,
      instanceLabel: ctx.instanceLabel,
      instanceUrl: ctx.instanceUrl
    })
  };
}

export function renderRejectedEmail(ctx: RejectedContext) {
  const body = `
    <div style="font-size:14px;line-height:1.6;">
      Your request was reviewed and not approved at this time.
    </div>
    ${
      ctx.loginUrl
        ? `<div style="margin-top:10px;color:#bfa98b;">You can reapply here: <a href="${escapeHtml(
            ctx.loginUrl
          )}" style="color:#e0b46b;">${escapeHtml(ctx.loginUrl)}</a></div>`
        : ""
    }
  `;
  return {
    subject: "FrameWorkX Access Update",
    text: "Your request was not approved at this time.",
    html: renderMailShell({
      title: "FrameWorkX",
      subtitle: "Access update",
      bodyHtml: body,
      instanceLabel: ctx.instanceLabel,
      instanceUrl: ctx.instanceUrl
    })
  };
}

export function renderPasswordResetEmail(ctx: ResetContext) {
  const body = `
    <div style="font-size:14px;line-height:1.6;">
      A password reset was requested for your account. Use the link below to set a new password.
    </div>
    <div style="margin-top:12px;">
      <a href="${escapeHtml(ctx.resetUrl)}" style="color:#e0b46b;">${escapeHtml(ctx.resetUrl)}</a>
    </div>
  `;
  return {
    subject: "FrameWorkX Password Reset",
    text: `Reset your password: ${ctx.resetUrl}`,
    html: renderMailShell({
      title: "FrameWorkX",
      subtitle: "Password reset",
      bodyHtml: body,
      instanceLabel: ctx.instanceLabel,
      instanceUrl: ctx.instanceUrl
    })
  };
}

export function renderTrainingNotification(ctx: TrainingContext) {
  const body = `
    <div style="font-size:14px;line-height:1.6;">
      Training update${ctx.runName ? ` for <strong>${escapeHtml(ctx.runName)}</strong>` : ""}.
    </div>
    ${ctx.status ? `<div style="margin-top:8px;">Status: ${escapeHtml(ctx.status)}</div>` : ""}
    ${
      ctx.detailUrl
        ? `<div style="margin-top:10px;"><a href="${escapeHtml(
            ctx.detailUrl
          )}" style="color:#e0b46b;">View details</a></div>`
        : ""
    }
  `;
  return {
    subject: "FrameWorkX Training Notification",
    text: `Training update${ctx.status ? `: ${ctx.status}` : ""}`,
    html: renderMailShell({
      title: "FrameWorkX",
      subtitle: "Training notification",
      bodyHtml: body,
      instanceLabel: ctx.instanceLabel,
      instanceUrl: ctx.instanceUrl
    })
  };
}

export function renderCommentNotification(ctx: CommentContext) {
  const body = `
    <div style="font-size:14px;line-height:1.6;">
      ${ctx.author ? `${escapeHtml(ctx.author)} commented on your image.` : "New comment on your image."}
    </div>
    ${ctx.body ? `<div style="margin-top:8px;">"${escapeHtml(ctx.body)}"</div>` : ""}
    ${
      ctx.detailUrl
        ? `<div style="margin-top:10px;"><a href="${escapeHtml(
            ctx.detailUrl
          )}" style="color:#e0b46b;">View comment</a></div>`
        : ""
    }
  `;
  return {
    subject: "FrameWorkX Comment Notification",
    text: ctx.body ? `New comment: ${ctx.body}` : "New comment on your image.",
    html: renderMailShell({
      title: "FrameWorkX",
      subtitle: "Comment notification",
      bodyHtml: body,
      instanceLabel: ctx.instanceLabel,
      instanceUrl: ctx.instanceUrl
    })
  };
}
