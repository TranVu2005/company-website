"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { submitLead, type LeadFormState } from "@/app/actions/leads";

const initialState: LeadFormState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn btn-primary"
      disabled={pending}
      style={{ width: "100%" }}
    >
      {pending ? "Đang gửi..." : "Gửi yêu cầu"}
    </button>
  );
}

export default function ContactForm() {
  const [state, formAction] = useActionState(submitLead, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset form khi gửi thành công
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  const err = state.errors || {};

  return (
    <form id="contact-form" ref={formRef} action={formAction}>
      <input type="hidden" name="type" value="contact" />
      {/* Honeypot chống spam — ẩn với người dùng, bot hay điền.
          autoComplete="new-password" + tên field không phổ biến để trình
          duyệt/trình quản lý mật khẩu không tự động điền nhầm vào đây. */}
      <input
        type="text"
        name="hp_confirm_field"
        tabIndex={-1}
        autoComplete="new-password"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
      />

      <div className="grid grid-2">
        <div className="form-group">
          <label className="form-label" htmlFor="name">
            Họ và tên *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-control"
            placeholder="Nhập họ tên của bạn"
            aria-invalid={!!err.name}
          />
          {err.name && <span className="field-error">{err.name}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="phone">
            Số điện thoại *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="form-control"
            placeholder="Nhập số điện thoại"
            aria-invalid={!!err.phone}
          />
          {err.phone && <span className="field-error">{err.phone}</span>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="email">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className="form-control"
          placeholder="Nhập địa chỉ email"
          aria-invalid={!!err.email}
        />
        {err.email && <span className="field-error">{err.email}</span>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="message">
          Nội dung *
        </label>
        <textarea
          id="message"
          name="message"
          className="form-control"
          placeholder="Bạn cần chúng tôi tư vấn gì?"
          aria-invalid={!!err.message}
        />
        {err.message && <span className="field-error">{err.message}</span>}
      </div>

      <div className="form-group form-consent">
        <label>
          <input type="checkbox" name="consent" value="yes" /> Tôi đồng ý với{" "}
          <Link href="/chinh-sach/chinh-sach-bao-mat" target="_blank">
            chính sách bảo mật
          </Link>{" "}
          và việc xử lý dữ liệu cá nhân của tôi. *
        </label>
        {err.consent && <span className="field-error">{err.consent}</span>}
      </div>

      <SubmitButton />

      {state.status !== "idle" && state.message && (
        <div
          className={`form-status ${
            state.status === "success" ? "success" : "error"
          }`}
        >
          {state.message}
        </div>
      )}
    </form>
  );
}
