from django.db import migrations

# Standard SEO task categories from the PRD (module 4), with default hour
# estimates where the notes doc gave a concrete number — these seed
# sensible defaults for new tasks but are fully editable afterwards.
CATEGORIES = [
    ("technical_seo", "SEO Audit", 8),
    ("technical_seo", "Core Web Vitals", None),
    ("technical_seo", "Speed Optimization", None),
    ("technical_seo", "Schema", None),
    ("technical_seo", "Sitemap", None),
    ("technical_seo", "Robots.txt", None),
    ("technical_seo", "Canonical", None),
    ("technical_seo", "Indexing Issues", None),
    ("technical_seo", "Search Console Fixes", 1),
    ("keyword_research", "Keyword Discovery", 3),
    ("keyword_research", "Search Intent", None),
    ("keyword_research", "Competitor Analysis", None),
    ("keyword_research", "Keyword Mapping", None),
    ("content_seo", "Topic Research", None),
    ("content_seo", "Content Brief", 1),
    ("content_seo", "Writing", None),
    ("content_seo", "Editing", None),
    ("content_seo", "Publishing", None),
    ("content_seo", "Internal Linking", None),
    ("content_seo", "Content Update", 2),
    ("product_seo", "Product Upload", None),
    ("product_seo", "Product Title Optimization", None),
    ("product_seo", "Meta Description", None),
    ("product_seo", "Image Optimization", None),
    ("product_seo", "Product Schema", None),
    ("link_building", "Prospecting", None),
    ("link_building", "Outreach", None),
    ("link_building", "Guest Post", None),
    ("link_building", "Monitoring", None),
    ("reporting", "Monthly Report", 3),
    ("reporting", "Ranking Report", None),
    ("reporting", "Traffic Analysis", None),
]


def seed_categories(apps, schema_editor):
    TaskCategory = apps.get_model("tasks", "TaskCategory")
    for group, name, hours in CATEGORIES:
        TaskCategory.objects.get_or_create(
            name=name, group=group, defaults={"default_estimated_hours": hours}
        )


def remove_categories(apps, schema_editor):
    TaskCategory = apps.get_model("tasks", "TaskCategory")
    names = [name for _group, name, _hours in CATEGORIES]
    TaskCategory.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_categories, remove_categories),
    ]
