import google.generativeai as genai

API_KEY = "AIzaSyB7Y74g99hsWJ2Ka_IE-70sztJqVva9w4I"

genai.configure(api_key=API_KEY)

models = genai.list_models()
for m in models:
    print(m.name)