import justpy as jp
from .definition import Definition


class Dictionary:
    PATH = "/dictionary"

    @classmethod
    def serve(cls, req):
        wp = jp.QuasarPage(tailwind=True)

        # Main container with proper flex layout
        main_div = jp.Div(a=wp, classes="bg-gray-200 min-h-screen p-4 flex flex-col items-center")

        # Header
        jp.Div(a=main_div,
               text="Instant English Dictionary!",
               classes="text-5xl font-bold text-gray-800 mt-8 mb-2 text-center")

        jp.Div(a=main_div,
               text="Get the definition of any English word instantly",
               classes="text-xl text-gray-600 mb-10 text-center")

        # Input area
        input_container = jp.Div(a=main_div, classes="w-full max-w-2xl flex gap-4 mb-8")

        output_div = jp.Div(a=main_div,
                            classes="w-full max-w-2xl bg-white border-2 border-gray-300 rounded-2xl p-6 min-h-[180px] "
                                    "text-lg leading-relaxed shadow-sm")

        input_box = jp.Input(a=input_container,
                             placeholder="Type in any English word here...", outputdiv=output_div,
                             classes="flex-1 bg-white border-2 border-gray-300 rounded-xl py-4 px-6 text-lg "
                                     "focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
                             )
        input_box.on('input', cls.get_definition)

        # Output area - now clearly visible


        # Store reference to output_div on the button (or use a better pattern)
        # Since the button is created after output_div, we can attach it now
        button = input_container.components[-1]  # last child = button
        button.outputdiv = output_div
        button.inputbox = input_box

        return wp

    @staticmethod
    def get_definition(widget, msg):
        if not widget.inputbox.value.strip():
            widget.outputdiv.text = "Please enter a word."
        else:
            try:
                definition = Definition(widget.inputbox.value).get()
                widget.outputdiv.text = " ".join(definition)
            except Exception as e:
                widget.outputdiv.text = f"Error: {str(e)}"

        widget.outputdiv.update()