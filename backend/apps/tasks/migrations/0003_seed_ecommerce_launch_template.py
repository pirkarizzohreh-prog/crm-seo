from django.conf import settings
from django.db import migrations

# A few categories the standard SEO taxonomy (0002) doesn't cover — store
# setup, compliance, and product photography aren't SEO work but they're
# real line items in an "e-commerce launch" project.
NEW_CATEGORIES = [
    ("design_dev", "Hosting & Domain Setup", None),
    ("design_dev", "Theme Purchase & Installation", None),
    ("design_dev", "Theme Customization", None),
    ("design_dev", "Payment & Shipping Setup", None),
    ("other", "Enamad Trust Seal", None),
    ("other", "Product Photography", None),
]

TEMPLATE_NAME = "راه‌اندازی فروشگاه اینترنتی + سئوی اولیه"

# (title, category group, category name, estimated hours) — 70h total,
# ordered the way the work actually has to happen: store live first, then
# Enamad (needs a working site), then product content, then SEO.
ITEMS = [
    ("خرید و تنظیم هاست و دامنه", "design_dev", "Hosting & Domain Setup", 2),
    ("خرید قالب فروشگاهی مناسب", "design_dev", "Theme Purchase & Installation", 1),
    ("نصب قالب و تنظیمات اولیه فروشگاه", "design_dev", "Theme Purchase & Installation", 3),
    ("سفارشی‌سازی قالب (لوگو، رنگ، هدر/فوتر، صفحات اصلی)", "design_dev", "Theme Customization", 8),
    ("تنظیم درگاه پرداخت و روش‌های ارسال", "design_dev", "Payment & Shipping Setup", 2),
    ("آماده‌سازی مدارک و ثبت درخواست نماد اعتماد (اینماد)", "other", "Enamad Trust Seal", 2),
    ("پیگیری و رفع ایرادات نماد اعتماد", "other", "Enamad Trust Seal", 2),
    ("عکاسی محصولات", "other", "Product Photography", 10),
    ("ویرایش و آماده‌سازی تصاویر محصولات", "other", "Product Photography", 4),
    ("نوشتن توضیحات محصولات", "product_seo", "Product Upload", 8),
    ("درج محصولات در سایت (عکس + توضیحات + قیمت + دسته‌بندی)", "product_seo", "Product Upload", 10),
    ("بررسی سئو فنی اولیه فروشگاه (سرعت، موبایل، SSL، ساختار URL)", "technical_seo", "SEO Audit", 4),
    ("تحقیق کلمات کلیدی محصولات و دسته‌بندی‌ها", "keyword_research", "Keyword Discovery", 3),
    ("بهینه‌سازی عنوان و توضیحات متا صفحه اصلی و دسته‌بندی‌ها", "product_seo", "Product Title Optimization", 3),
    ("بهینه‌سازی سئو محصولات (عنوان، متا، Schema)", "product_seo", "Product Schema", 4),
    ("ساخت Sitemap و اتصال به Search Console", "technical_seo", "Sitemap", 2),
    ("تنظیم Robots.txt و بررسی ایندکس صفحات", "technical_seo", "Robots.txt", 2),
]


def seed_template(apps, schema_editor):
    TaskCategory = apps.get_model("tasks", "TaskCategory")
    TaskTemplate = apps.get_model("tasks", "TaskTemplate")
    TaskTemplateItem = apps.get_model("tasks", "TaskTemplateItem")
    User = apps.get_model(settings.AUTH_USER_MODEL)

    for group, name, hours in NEW_CATEGORIES:
        TaskCategory.objects.get_or_create(
            name=name, group=group, defaults={"default_estimated_hours": hours}
        )

    # role="owner" is the User model's default, so every account created via
    # createsuperuser (this app ships with a single Owner account) qualifies.
    for owner in User.objects.filter(role="owner"):
        template, created = TaskTemplate.objects.get_or_create(
            owner=owner,
            name=TEMPLATE_NAME,
            defaults={
                "description": "چک‌لیست کامل راه‌اندازی یک فروشگاه اینترنتی از صفر تا شروع سئو: هاست و قالب، نماد اعتماد، عکاسی و درج محصولات، سپس سئوی اولیه.",
                "project_type": "ecommerce_setup",
            },
        )
        if not created:
            continue  # don't duplicate items if this migration re-runs
        for order, (title, group, cat_name, hours) in enumerate(ITEMS):
            category = TaskCategory.objects.filter(name=cat_name, group=group).first()
            TaskTemplateItem.objects.create(
                template=template,
                title=title,
                category=category,
                estimated_hours=hours,
                order=order,
            )


def remove_template(apps, schema_editor):
    TaskTemplate = apps.get_model("tasks", "TaskTemplate")
    TaskTemplate.objects.filter(name=TEMPLATE_NAME).delete()
    TaskCategory = apps.get_model("tasks", "TaskCategory")
    TaskCategory.objects.filter(
        name__in=[name for _group, name, _hours in NEW_CATEGORIES]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0002_seed_default_categories"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(seed_template, remove_template),
    ]
