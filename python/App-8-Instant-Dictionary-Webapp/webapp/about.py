import justpy as jp

class About:

    PATH = "/about"
    def __init__(self):
        pass

    def serve(self):
        wp = jp.QuasarPage(tailwind=True)
        div = jp.Div(a=wp, classes="bg-gray-200 h-screen")
        jp.Div(a=div, text="This is the About page!", classes="text-4xl m-2")
        jp.Div(a=div, text="""
        BLA BLA 
        """, classes="text-lg")

        return wp