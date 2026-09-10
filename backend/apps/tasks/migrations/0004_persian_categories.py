from django.db import migrations

# (group, old English name, new Persian name) — renames every category
# seeded by 0002/0003 in place (categories are referenced by id everywhere,
# never by name, so this is safe regardless of how many tasks/templates
# already point at them).
RENAMES = [
    ("technical_seo", "SEO Audit", "بررسی فنی سئو (سئو آدیت)"),
    ("technical_seo", "Core Web Vitals", "معیارهای پایه وب (Core Web Vitals)"),
    ("technical_seo", "Speed Optimization", "بهینه‌سازی سرعت سایت"),
    ("technical_seo", "Schema", "پیاده‌سازی اسکیما (Schema)"),
    ("technical_seo", "Sitemap", "نقشه سایت (Sitemap)"),
    ("technical_seo", "Robots.txt", "فایل Robots.txt"),
    ("technical_seo", "Canonical", "تگ کنونیکال (Canonical)"),
    ("technical_seo", "Indexing Issues", "رفع مشکلات ایندکس"),
    ("technical_seo", "Search Console Fixes", "رفع خطاهای سرچ کنسول"),
    ("keyword_research", "Keyword Discovery", "یافتن کلمات کلیدی"),
    ("keyword_research", "Search Intent", "تحلیل قصد جستجو (Search Intent)"),
    ("keyword_research", "Competitor Analysis", "تحلیل رقبا"),
    ("keyword_research", "Keyword Mapping", "نگاشت کلمات کلیدی (Keyword Mapping)"),
    ("content_seo", "Topic Research", "تحقیق موضوعی محتوا"),
    ("content_seo", "Content Brief", "تولید بریف محتوا"),
    ("content_seo", "Writing", "نگارش محتوا"),
    ("content_seo", "Editing", "ویرایش محتوا"),
    ("content_seo", "Publishing", "انتشار محتوا"),
    ("content_seo", "Internal Linking", "لینک‌سازی داخلی"),
    ("content_seo", "Content Update", "به‌روزرسانی محتوا"),
    ("product_seo", "Product Upload", "درج محصول"),
    ("product_seo", "Product Title Optimization", "بهینه‌سازی عنوان محصول"),
    ("product_seo", "Meta Description", "نوشتن متا دیسکریپشن"),
    ("product_seo", "Image Optimization", "بهینه‌سازی تصاویر"),
    ("product_seo", "Product Schema", "اسکیمای محصول (Product Schema)"),
    ("link_building", "Prospecting", "شناسایی فرصت‌های لینک‌سازی"),
    ("link_building", "Outreach", "ارتباط‌گیری برای لینک‌سازی (Outreach)"),
    ("link_building", "Guest Post", "گست پست (Guest Post)"),
    ("link_building", "Monitoring", "پایش لینک‌های ساخته‌شده"),
    ("reporting", "Monthly Report", "گزارش ماهانه"),
    ("reporting", "Ranking Report", "گزارش رتبه کلمات کلیدی"),
    ("reporting", "Traffic Analysis", "تحلیل ترافیک سایت"),
    ("design_dev", "Hosting & Domain Setup", "خرید هاست و دامنه"),
    ("design_dev", "Theme Purchase & Installation", "خرید و نصب قالب"),
    ("design_dev", "Theme Customization", "سفارشی‌سازی قالب"),
    ("design_dev", "Payment & Shipping Setup", "تنظیم درگاه پرداخت و ارسال"),
    ("other", "Enamad Trust Seal", "نماد اعتماد الکترونیکی (اینماد)"),
    ("other", "Product Photography", "عکاسی محصول"),
]

NEW_CATEGORY = ("product_seo", "انتشار محتوای دسته‌بندی محصول")


def rename_forward(apps, schema_editor):
    TaskCategory = apps.get_model("tasks", "TaskCategory")
    for group, old_name, new_name in RENAMES:
        TaskCategory.objects.filter(group=group, name=old_name).update(name=new_name)

    group, name = NEW_CATEGORY
    TaskCategory.objects.get_or_create(group=group, name=name)


def rename_backward(apps, schema_editor):
    TaskCategory = apps.get_model("tasks", "TaskCategory")
    for group, old_name, new_name in RENAMES:
        TaskCategory.objects.filter(group=group, name=new_name).update(name=old_name)

    group, name = NEW_CATEGORY
    TaskCategory.objects.filter(group=group, name=name).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0003_seed_ecommerce_launch_template"),
    ]

    operations = [
        migrations.RunPython(rename_forward, rename_backward),
    ]
