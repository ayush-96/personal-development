import justpy as jp
from webapp.about import About
from webapp.home import Home
from webapp.dictionary import Dictionary

jp.Route(Home.PATH, Home.serve)
jp.Route(About.PATH, About.serve)
jp.Route(Dictionary.PATH, Dictionary.serve)
jp.justpy(port=8001)